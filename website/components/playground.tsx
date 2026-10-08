// The playground (hydrated): open, drop or record a file, edit its tags, save a copy; for nerds, the byte
// map, structure, warnings, raw result and hex of the file. It reaches the library only through
// readFromBlob / writeToBlob, and asks lib/byte-map.ts which byte range is what. VERIFIED: make e2e opens,
// edits and saves every sample format here, checks the byte map and hex, cover, Reset, discard and recording.
// The lists a file fills (facts, byte map, legend, structure, warnings) are JSX components passed to defuss
// render(), so they read like the markup below instead of hand-built DOM calls.
import { render, type Props } from "defuss";
import { PICTURE_TYPES, readFromBlob, writeToBlob, type ReadResult } from "audio-tag/browser";
import { byteMap, type Region } from "../lib/byte-map.js";

const FORMATS: Record<ReadResult["format"], string> = { mpeg: "MP3 · ID3", mp4: "MP4 · M4A", flac: "FLAC", ogg: "Ogg", aiff: "AIFF", riff: "WAV" };
const ACCEPT = "audio/*,.mp3,.m4a,.m4b,.mp4,.mov,.flac,.ogg,.opus,.oga,.aif,.aiff,.aifc,.wav";
const KINDS: [Region["kind"], string][] = [["tag", "tags"], ["header", "headers the reader uses"], ["free", "free space for in-place writes"], ["audio", "audio data"], ["other", "other"]];

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let current: { file: File; result: ReadResult; regions: Region[] } | undefined;
let urls: string[] = [];
let shownPicture = 0; // index into current.result.metadata.pictures

const toast = (options: { title: string; description?: string; variant?: string; duration?: number }) =>
  (globalThis as any).df$?.shadcn?.toast?.show(options);

function objectUrl(blob: Blob) {
  const url = URL.createObjectURL(blob);
  urls.push(url);
  return url;
}

const minutes = (milliseconds: number) =>
  milliseconds < 10000
    ? `${(milliseconds / 1000).toFixed(1)} s`
    : `${Math.floor(milliseconds / 60000)}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, "0")}`;
const size = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`);
const hex = (offset: number) => "0x" + offset.toString(16).padStart(8, "0");

function facts(file: File, result: ReadResult) {
  const rows: [string, string][] = [["Size", size(file.size)]];
  if (result.metadata.length) rows.push(["Length", minutes(result.metadata.length)]);
  if (result.format === "mpeg") {
    if (result.id3v2) rows.push(["ID3v2", `2.${result.id3v2.version.major}`]);
    rows.push(["ID3v1", result.id3v1 ? "yes" : "no"], ["Lyrics3", result.lyrics3 ? "yes" : "no"]);
  }
  if (result.format === "ogg") rows.push(["Codec", result.ogg.codec]);
  if (result.format === "flac" && result.streamInfo) rows.push(["Sample rate", `${result.streamInfo.sampleRate} Hz`], ["Channels", String(result.streamInfo.channels)]);
  if (result.format === "aiff" && result.common) rows.push(["Sample rate", `${Math.round(result.common.sampleRate)} Hz`], ["Channels", String(result.common.channels)]);
  if (result.format === "riff" && result.audio) rows.push(["Sample rate", `${result.audio.format.sampleRate} Hz`], ["Channels", String(result.audio.format.channels)]);
  rows.push(["Pictures", String(result.metadata.pictures?.length ?? 0)]);
  render(<>{rows.map(([name, value]) => <Fact name={name} value={value} />)}</>, $("facts"));
}

const Fact = ({ name, value }: Props & { name: string; value: string }) => (
  <>
    <dt>{name}</dt>
    <dd>{value}</dd>
  </>
);

function fill(metadata: ReadResult["metadata"]) {
  const fields = ($("editor") as HTMLFormElement).elements as any;
  fields.title.value = metadata.title ?? "";
  fields.artist.value = (metadata.artist ?? []).join(", ");
  fields.albumArtist.value = metadata.albumArtist ?? "";
  fields.album.value = metadata.album ?? "";
  fields.genre.value = (metadata.genre ?? []).join(", ");
  fields.recordingTime.value = metadata.recordingTime ?? "";
  fields.track.value = metadata.track?.no ?? "";
  fields.tracks.value = metadata.track?.of ?? "";
  fields.comment.value = metadata.comments?.[0]?.text ?? "";
  $<HTMLInputElement>("f-cover").value = "";
  $<HTMLInputElement>("f-nocover").checked = false;
  $<HTMLInputElement>("f-nocover").disabled = !metadata.pictures?.length;
}

// ---- for nerds ---------------------------------------------------------------------------------------

function drawByteMap(regions: Region[], total: number, format: string) {
  const map = $("byte-map");
  map.className = `byte-map fmt-${format}`;
  render(<>{regions.map((region, index) => <RegionButton region={region} index={index} total={total} />)}</>, map);
  $("legend").className = `legend fmt-${format}`; // the format color for the legend swatches
  const kinds = KINDS.filter(([kind]) => regions.some((region) => region.kind === kind));
  render(<>{kinds.map(([kind, text]) => <LegendEntry kind={kind} text={text} />)}</>, $("legend"));
  render(<>{regions.map((region) => <StructureRow region={region} />)}</>, $("structure"));
}

function RegionButton({ region, index, total }: Props & { region: Region; index: number; total: number }) {
  const share = (region.end - region.start) / total;
  return (
    <button
      type="button"
      class={`k-${region.kind}`}
      title={`${region.label} · ${region.kind} · offset ${region.start} · ${size(region.end - region.start)}`}
      style={`flex: ${Math.max(share, 0.02)} 1 0`}
      data-region={String(index)}
      aria-label={`${region.label}, ${region.kind}, bytes ${region.start} to ${region.end - 1}`}
      aria-pressed="false"
      onClick={() => select(index)}
    >
      {share > 0.08 ? region.label : ""}
    </button>
  );
}

const LegendEntry = ({ kind, text }: Props & { kind: Region["kind"]; text: string }) => (
  <span>
    <i class={`k-${kind}`}></i>
    {text}
  </span>
);

const StructureRow = ({ region }: Props & { region: Region }) => (
  <tr class="table-row">
    <td class="table-cell"><code>{region.label}</code></td>
    <td class="table-cell">{region.kind}</td>
    <td class="table-cell mono">{`${region.start} (${hex(region.start)})`}</td>
    <td class="table-cell mono">{size(region.end - region.start)}</td>
  </tr>
);

async function select(index: number) {
  if (!current) return;
  const region = current.regions[index];
  for (const button of $("byte-map").querySelectorAll("button")) button.setAttribute("aria-pressed", String(button.dataset.region === String(index)));
  const bytes = new Uint8Array(await current.file.slice(region.start, Math.min(region.end, region.start + 256)).arrayBuffer());
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const row = bytes.subarray(offset, offset + 16);
    const hexes = [...row].map((byte) => byte.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const ascii = [...row].map((byte) => (byte >= 32 && byte < 127 ? String.fromCharCode(byte) : ".")).join("");
    lines.push(`${(region.start + offset).toString(16).padStart(8, "0")}  ${hexes}  ${ascii}`);
  }
  $("region-title").textContent = `${region.label} · ${region.kind} · bytes ${region.start}–${region.end - 1} (${size(region.end - region.start)})`;
  $("hex").textContent = lines.join("\n") + (region.end - region.start > 256 ? "\n…" : "");
}

function nerds(result: ReadResult) {
  const replacer = (_key: string, value: unknown) => (typeof value === "bigint" ? `${value}n` : value instanceof Uint8Array ? `<${value.length} bytes>` : value);
  $("dump").textContent = JSON.stringify(result, replacer, 2);
  render(
    <>
      {result.warnings.length
        ? result.warnings.map((warning) => <WarningItem code={warning.code} message={warning.message} />)
        : <li>No warnings: the file follows its spec.</li>}
    </>,
    $("warning-list"),
  );
  $("warning-count").textContent = String(result.warnings.length);
}

const WarningItem = ({ code, message }: Props & { code: string; message: string }) => (
  <li>
    <span class="badge">{code}</span> {message}
  </li>
);

// ---- pictures -------------------------------------------------------------------------------------------

const PICTURE_FORMATS: Record<string, string> = { "image/jpeg": "JPEG", "image/jpg": "JPEG", "image/png": "PNG", "image/gif": "GIF", "image/webp": "WebP", "image/bmp": "BMP" };

// Shows picture `index` (wrapping around) at its natural aspect ratio, with its pixel size, format, byte size
// and picture type; the pixel size is known only once the browser has decoded the image.
function showPicture(index: number) {
  const pictures = current?.result.metadata.pictures ?? [];
  if (!pictures.length) return;
  shownPicture = (index + pictures.length) % pictures.length;
  const picture = pictures[shownPicture];
  const image = $<HTMLImageElement>("cover");
  const details = [
    PICTURE_FORMATS[picture.mimeType.toLowerCase()] ?? picture.mimeType,
    size(picture.data.length),
    PICTURE_TYPES[picture.type] ?? `type ${picture.type}`,
    ...(picture.description ? [`"${picture.description}"`] : []),
  ];
  $("cover-info").textContent = details.join(" · ");
  image.alt = `${PICTURE_TYPES[picture.type] ?? "Picture"}${picture.description ? `: ${picture.description}` : ""}`;
  image.onload = () => {
    $("cover-info").textContent = [`${image.naturalWidth} × ${image.naturalHeight} px`, ...details].join(" · ");
    image.classList.toggle("tiny", image.naturalHeight < 48); // enlarged to the 3rem minimum: keep the pixels sharp
  };
  image.src = objectUrl(new Blob([picture.data as BlobPart], { type: picture.mimeType }));
  $("cover-count").textContent = `${shownPicture + 1} of ${pictures.length}`;
}

// ---- open, edit, save ----------------------------------------------------------------------------------

async function load(file: File) {
  let result: ReadResult;
  try {
    result = await readFromBlob(file);
  } catch (error: any) {
    toast({ title: `Can't read ${file.name}`, description: error.message, variant: "destructive" });
    return;
  }
  for (const url of urls) URL.revokeObjectURL(url);
  urls = [];
  const regions = byteMap(result, file.size);
  current = { file, result, regions };

  $("empty").hidden = true;
  $("workspace").hidden = false;
  $("file-name").textContent = file.name;
  const badge = $("format");
  badge.textContent = FORMATS[result.format];
  badge.className = `chip fmt-${result.format}`;
  $<HTMLAudioElement>("player").src = objectUrl(file);
  const pictures = result.metadata.pictures ?? [];
  $("cover-box").hidden = !pictures.length;
  $("cover-nav").hidden = pictures.length < 2;
  if (pictures.length) showPicture(Math.max(0, pictures.findIndex((picture) => picture.type === 3))); // the front cover first
  facts(file, result);
  fill(result.metadata);
  drawByteMap(regions, file.size, result.format);
  nerds(result);
  select(Math.max(0, regions.findIndex((region) => region.kind === "tag")));
}

// The fields of the form that differ from the file: unchanged fields keep their bytes, emptied ones go (null).
function update(): Record<string, unknown> {
  const fields = ($("editor") as HTMLFormElement).elements as any;
  const old = current!.result.metadata;
  const list = (text: string) => text.split(",").map((item) => item.trim()).filter(Boolean);
  const changes: Record<string, unknown> = {};
  const set = (key: string, value: unknown, before: unknown) => {
    if (JSON.stringify(value ?? null) !== JSON.stringify(before ?? null)) changes[key] = value ?? null;
  };
  set("title", fields.title.value.trim() || undefined, old.title);
  set("artist", list(fields.artist.value).length ? list(fields.artist.value) : undefined, old.artist);
  set("albumArtist", fields.albumArtist.value.trim() || undefined, old.albumArtist);
  set("album", fields.album.value.trim() || undefined, old.album);
  set("genre", list(fields.genre.value).length ? list(fields.genre.value) : undefined, old.genre);
  set("recordingTime", fields.recordingTime.value.trim() || undefined, old.recordingTime);
  const trackNo = fields.track.value ? Number(fields.track.value) : undefined;
  const trackOf = fields.tracks.value ? Number(fields.tracks.value) : undefined;
  if (trackNo !== old.track?.no || trackOf !== old.track?.of) changes.track = trackNo || trackOf ? { no: trackNo, of: trackOf } : null;
  const comment = fields.comment.value;
  if (comment !== (old.comments?.[0]?.text ?? "")) {
    const rest = old.comments?.slice(1) ?? [];
    changes.comments = comment
      ? [{ language: old.comments?.[0]?.language ?? "eng", description: old.comments?.[0]?.description ?? "", text: comment }, ...rest]
      : rest.length ? rest : null;
  }
  return changes;
}

const unsaved = () => !!current && (Object.keys(update()).length > 0 || ($("f-cover") as HTMLInputElement).files!.length > 0 || $<HTMLInputElement>("f-nocover").checked);

// Asks before unsaved changes are thrown away; resolves to true when it is fine to go on.
function confirmDiscard(action: string): Promise<boolean> {
  if (!unsaved()) return Promise.resolve(true);
  const dialog = $<HTMLDialogElement>("discard-dialog");
  $("discard-desc").textContent = `You changed tags in ${current!.file.name} that are not saved yet. ${action} discards these changes.`;
  return new Promise((resolve) => {
    const answer = (event: Event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>("[data-answer]");
      if (!button) return;
      dialog.removeEventListener("click", answer);
      resolve(button.dataset.answer === "discard");
    };
    dialog.addEventListener("click", answer);
    const api = (dialog as any).api;
    if (api) api.setState("open");
    else dialog.showModal();
  });
}

async function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (await confirmDiscard("Opening another file")) load(file);
  else input.value = "";
}

async function onSave(event: Event) {
  event.preventDefault();
  if (!current) return;
  const save = $<HTMLButtonElement>("save");
  const metadata = update();
  const image = ($("f-cover") as HTMLInputElement).files![0];
  if (image) metadata.pictures = [{ type: 3, mimeType: image.type, description: "", data: new Uint8Array(await image.arrayBuffer()) }];
  else if ($<HTMLInputElement>("f-nocover").checked) metadata.pictures = null;
  const changed = Object.keys(metadata);
  if (!changed.length) {
    toast({ title: "Nothing changed", description: "Edit a field first.", variant: "info" });
    return;
  }
  save.disabled = true;
  try {
    const saved = await writeToBlob(current.file, { metadata: metadata as any });
    Object.assign(document.createElement("a"), { href: objectUrl(saved), download: saved.name }).click();
    await load(saved); // read it back, so you see what was written
    toast({ title: `Saved ${saved.name}`, description: `Changed ${changed.join(", ")}. ${size(saved.size)}.`, variant: "success" });
  } catch (error: any) {
    toast({ title: "Not saved", description: error.message, variant: "destructive", duration: 8000 });
  } finally {
    save.disabled = false;
  }
}

// Puts the file's tags back into the form.
function onReset() {
  if (current) fill(current.result.metadata);
}

// ---- recording ----------------------------------------------------------------------------------------

// 16-bit mono PCM in a RIFF WAVE file ("fmt " + "data"), without tags.
function wavFile(samples: ArrayLike<number>, rate: number, name: string) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const ascii = (position: number, text: string) => [...text].forEach((char, index) => view.setUint8(position + index, char.charCodeAt(0)));
  ascii(0, "RIFF"); view.setUint32(4, 36 + samples.length * 2, true); ascii(8, "WAVE");
  ascii(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, "data"); view.setUint32(40, samples.length * 2, true);
  for (let index = 0; index < samples.length; index++) view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, samples[index])) * 0x7fff, true);
  return new File([buffer], name, { type: "audio/wav" });
}

// When there is no microphone: a half-second 440 Hz tone.
const testTone = () => {
  const rate = 8000, count = rate / 2;
  const sample = (index: number) => Math.sin((2 * Math.PI * 440 * index) / rate) * 0.25 * Math.min(1, (count - index) / 400);
  return wavFile(Array.from({ length: count }, (_, index) => sample(index)), rate, "sample.wav");
};

// An AudioWorklet copies the raw samples, which become a WAV file on stop (MediaRecorder would give WebM).
const MAX_SECONDS = 30;
const TAP = "registerProcessor('tap', class extends AudioWorkletProcessor { process(inputs) { const channel = inputs[0][0]; if (channel) this.port.postMessage(channel.slice(0)); return true } })";
let recording: { stream: MediaStream; context: AudioContext; chunks: Float32Array[]; timer: ReturnType<typeof setInterval> } | undefined;

function setRecordButton(text: string, active: boolean) {
  $("record-label").textContent = text;
  $("record").setAttribute("data-variant", active ? "destructive" : "outline");
  $("record").setAttribute("aria-pressed", String(active));
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const context = new AudioContext();
  const module = URL.createObjectURL(new Blob([TAP], { type: "text/javascript" }));
  await context.audioWorklet.addModule(module);
  URL.revokeObjectURL(module);
  const tap = new AudioWorkletNode(context, "tap");
  const silent = context.createGain();
  silent.gain.value = 0; // the tap must reach the destination to run, but nothing is played back
  const chunks: Float32Array[] = [];
  tap.port.onmessage = (event) => chunks.push(event.data);
  context.createMediaStreamSource(stream).connect(tap).connect(silent).connect(context.destination);
  const started = performance.now();
  const tick = () => {
    const seconds = (performance.now() - started) / 1000;
    if (seconds >= MAX_SECONDS) return void stopRecording();
    setRecordButton(`Stop recording · ${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, "0")}`, true);
  };
  recording = { stream, context, chunks, timer: setInterval(tick, 250) };
  tick();
}

async function stopRecording() {
  const { stream, context, chunks, timer } = recording!;
  recording = undefined;
  clearInterval(timer);
  for (const track of stream.getTracks()) track.stop();
  await context.close();
  setRecordButton("No file at hand? Record with your mic", false);
  const samples = new Float32Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let position = 0;
  for (const chunk of chunks) { samples.set(chunk, position); position += chunk.length; }
  if (!samples.length) {
    toast({ title: "Nothing was recorded", description: "The microphone sent no sound. Try again.", variant: "warning" });
    return;
  }
  const now = new Date();
  const two = (value: number) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
  load(wavFile(samples, context.sampleRate, `recording-${stamp}.wav`));
}

async function onRecord() {
  if (recording) return stopRecording();
  if (!(await confirmDiscard("Recording a new file"))) return;
  const button = $<HTMLButtonElement>("record");
  button.disabled = true;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("this browser has no microphone access here (it needs https or localhost)");
    await startRecording();
  } catch (error: any) {
    const blocked = error.name === "NotAllowedError";
    toast({ title: blocked ? "Microphone blocked" : "No microphone", description: `${blocked ? "Allow the microphone in your browser to record" : error.message}. Here is a test tone instead.`, variant: "warning", duration: 8000 });
    load(testTone());
  } finally {
    button.disabled = false;
  }
}

if (typeof window !== "undefined") addEventListener("beforeunload", (event) => { if (unsaved()) event.preventDefault(); });

// ---- markup ---------------------------------------------------------------------------------------------

const Chevron = () => (
  <svg class="accordion-chevron" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
);

function Field({ id, name, label, hint, wide, ...rest }: Props & { id: string; name: string; label: string; hint?: string; wide?: boolean; type?: string; placeholder?: string; pattern?: string; min?: string }) {
  return (
    <div class={wide ? "wide" : ""}>
      <label class="label" for={id}>{label}</label>
      <input class="input" type="text" id={id} name={name} aria-describedby={hint ? `${id}-desc` : undefined} {...rest} />
      {hint ? <p class="field-description" id={`${id}-desc`}>{hint}</p> : ""}
    </div>
  );
}

export function Playground() {
  return (
    <div class="stack gap-6">
      <div class="play-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Open a file</h3>
            <p class="card-description">MP3, M4A, FLAC, Ogg, AIFF or WAV. It never leaves your browser.</p>
          </div>
          <div class="card-content stack gap-4">
            <div class="file-drop">
              <label class="file-drop-zone">
                <input class="file-drop-input" id="pick" type="file" name="files" accept={ACCEPT} onChange={onPick} />
                <span class="file-drop-title">Drop an audio file here or <span class="file-drop-browse">browse</span></span>
                <span class="file-drop-hint">Only the tags are read, so large files open quickly</span>
              </label>
              <p class="file-drop-error"></p>
            </div>
            <div>
              <button class="btn w-full" data-variant="outline" type="button" id="record" aria-pressed="false" aria-describedby="record-desc" onClick={onRecord}>
                <span id="record-label">No file at hand? Record with your mic</span>
              </button>
              <p class="field-description" id="record-desc">Up to 30 seconds, saved as a WAV file. Click again to stop.</p>
            </div>
          </div>
        </div>

        <section class="mk-empty-state" data-variant="dashed" aria-labelledby="empty-title" id="empty">
          <h3 class="mk-empty-state-title" id="empty-title">No file yet</h3>
          <p class="mk-empty-state-text">Open an audio file to see its tags, change them and download a copy. Curious how it is built? The details for nerds show every byte.</p>
        </section>
      </div>

      <div class="stack gap-6" id="workspace" hidden>
        <div class="play-grid">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title" id="file-name">File</h3>
              <p class="card-description"><span class="chip" id="format">format</span></p>
            </div>
            <div class="card-content stack gap-4">
              <figure class="cover-box" id="cover-box" hidden>
                <img class="cover" id="cover" alt="Cover picture" />
                <figcaption class="cover-info">
                  <span id="cover-info"></span>
                  <span class="cover-nav" id="cover-nav" hidden>
                    <button class="btn" data-variant="outline" data-size="icon-sm" type="button" id="cover-prev" aria-label="Previous picture" onClick={() => showPicture(shownPicture - 1)}>‹</button>
                    <span id="cover-count" aria-live="polite">1 of 1</span>
                    <button class="btn" data-variant="outline" data-size="icon-sm" type="button" id="cover-next" aria-label="Next picture" onClick={() => showPicture(shownPicture + 1)}>›</button>
                  </span>
                </figcaption>
              </figure>
              <audio id="player" controls preload="metadata" class="w-full"></audio>
              <dl class="facts" id="facts"></dl>
            </div>
          </div>

          <form class="card" id="editor" onSubmit={onSave}>
            <div class="card-header">
              <h3 class="card-title">Tags</h3>
              <p class="card-description">Empty fields are removed. Fields you don't touch keep their bytes.</p>
            </div>
            <div class="card-content fields">
              <Field id="f-title" name="title" label="Title" wide />
              <Field id="f-artist" name="artist" label="Artist" hint="Separate several with commas." />
              <Field id="f-albumArtist" name="albumArtist" label="Album artist" />
              <Field id="f-album" name="album" label="Album" />
              <Field id="f-genre" name="genre" label="Genre" hint="Separate several with commas." />
              <Field id="f-year" name="recordingTime" label="Recording date" placeholder="2024 or 2024-05-01" pattern="\d{4}(-\d{2}(-\d{2})?)?" />
              <div class="pair">
                <Field id="f-track" name="track" label="Track" type="number" min="1" />
                <Field id="f-tracks" name="tracks" label="of" type="number" min="1" />
              </div>
              <div class="wide">
                <label class="label" for="f-comment">Comment</label>
                <textarea class="textarea" id="f-comment" name="comment" data-rows="2" data-max-rows="6"></textarea>
              </div>
              <div class="wide">
                <label class="label" for="f-cover">New cover <span class="label-hint">(optional)</span></label>
                <input class="file-input" type="file" id="f-cover" accept="image/jpeg,image/png" />
              </div>
              <div class="wide check-row">
                <input class="checkbox" type="checkbox" id="f-nocover" />
                <label class="label" for="f-nocover">Remove the cover</label>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn" data-variant="outline" type="button" id="reset" onClick={onReset}>Reset</button>
              <button class="btn brand-btn" type="submit" id="save">Save and download</button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">For nerds</h3>
            <p class="card-description">How this file is built, byte by byte. Everything the library read, nothing hidden.</p>
          </div>
          <div class="card-content">
            <div class="accordion" id="nerds">
              <details class="accordion-item" id="nerds-map">
                <summary class="accordion-trigger"><span>Byte map</span><Chevron /></summary>
                <div class="accordion-content stack gap-4">
                  <div class="byte-map" id="byte-map" role="group" aria-label="Regions of the file, from the first byte to the last"></div>
                  <div class="legend" id="legend"></div>
                  <p class="mono" id="region-title"></p>
                  <pre class="hex" id="hex" aria-label="Hex dump of the selected region"></pre>
                </div>
              </details>
              <details class="accordion-item" id="nerds-structure">
                <summary class="accordion-trigger"><span>Structure</span><Chevron /></summary>
                <div class="accordion-content table-scroll">
                  <table class="table">
                    <thead><tr class="table-row"><th class="table-head">Region</th><th class="table-head">Kind</th><th class="table-head">Offset</th><th class="table-head">Size</th></tr></thead>
                    <tbody id="structure"></tbody>
                  </table>
                </div>
              </details>
              <details class="accordion-item" id="nerds-warnings">
                <summary class="accordion-trigger"><span>Warnings (<span id="warning-count">0</span>)</span><Chevron /></summary>
                <div class="accordion-content"><ul id="warning-list"></ul></div>
              </details>
              <details class="accordion-item" id="nerds-raw">
                <summary class="accordion-trigger"><span>Raw result of <code>readFromBlob(file)</code></span><Chevron /></summary>
                <div class="accordion-content"><pre class="dump"><code id="dump"></code></pre></div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <dialog id="discard-dialog" class="alert-dialog" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-desc">
        <div class="alert-dialog-content">
          <div class="alert-dialog-header">
            <h2 class="alert-dialog-title" id="discard-title">Discard your changes?</h2>
            <p class="alert-dialog-description" id="discard-desc">You changed tags that are not saved yet.</p>
          </div>
          <div class="alert-dialog-footer">
            <button class="btn" data-variant="outline" data-alert-dialog-close data-answer="keep">Keep editing</button>
            <button class="btn" data-variant="destructive" data-alert-dialog-close data-answer="discard">Discard changes</button>
          </div>
        </div>
      </dialog>
      <div id="toast-container" class="toast-container" aria-label="Notifications" data-position="bottom-right"></div>
    </div>
  );
}
