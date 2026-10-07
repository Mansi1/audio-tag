// The playground (hydrated): open, drop or record a file, edit its tags, save a copy; for nerds, the byte
// map, structure, warnings, raw result and hex of the file. It reaches the library only through
// readFromBlob / writeToBlob, and asks lib/byte-map.ts which byte range is what. VERIFIED: make e2e opens,
// edits and saves every sample format here, checks the byte map and hex, cover, Reset, discard and recording.
import type { Props } from "defuss";
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

const minutes = (ms: number) => (ms < 10000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`);
const size = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const hex = (n: number) => "0x" + n.toString(16).padStart(8, "0");
const el = (tag: string, props: Record<string, any> = {}, ...children: (Node | string)[]) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
};

function facts(file: File, r: ReadResult) {
  const rows: [string, string][] = [["Size", size(file.size)]];
  if (r.metadata.length) rows.push(["Length", minutes(r.metadata.length)]);
  if (r.format === "mpeg") {
    if (r.id3v2) rows.push(["ID3v2", `2.${r.id3v2.version.major}`]);
    rows.push(["ID3v1", r.id3v1 ? "yes" : "no"], ["Lyrics3", r.lyrics3 ? "yes" : "no"]);
  }
  if (r.format === "ogg") rows.push(["Codec", r.ogg.codec]);
  if (r.format === "flac" && r.streamInfo) rows.push(["Sample rate", `${r.streamInfo.sampleRate} Hz`], ["Channels", String(r.streamInfo.channels)]);
  if (r.format === "aiff" && r.common) rows.push(["Sample rate", `${Math.round(r.common.sampleRate)} Hz`], ["Channels", String(r.common.channels)]);
  if (r.format === "riff" && r.audio) rows.push(["Sample rate", `${r.audio.format.sampleRate} Hz`], ["Channels", String(r.audio.format.channels)]);
  rows.push(["Pictures", String(r.metadata.pictures?.length ?? 0)]);
  $("facts").replaceChildren(...rows.flatMap(([k, v]) => [el("dt", { textContent: k }), el("dd", { textContent: v })]));
}

function fill(m: ReadResult["metadata"]) {
  const f = ($("editor") as HTMLFormElement).elements as any;
  f.title.value = m.title ?? "";
  f.artist.value = (m.artist ?? []).join(", ");
  f.albumArtist.value = m.albumArtist ?? "";
  f.album.value = m.album ?? "";
  f.genre.value = (m.genre ?? []).join(", ");
  f.recordingTime.value = m.recordingTime ?? "";
  f.track.value = m.track?.no ?? "";
  f.tracks.value = m.track?.of ?? "";
  f.comment.value = m.comments?.[0]?.text ?? "";
  $<HTMLInputElement>("f-cover").value = "";
  $<HTMLInputElement>("f-nocover").checked = false;
  $<HTMLInputElement>("f-nocover").disabled = !m.pictures?.length;
}

// ---- for nerds ---------------------------------------------------------------------------------------

function drawByteMap(regions: Region[], total: number, format: string) {
  const map = $("byte-map");
  map.className = `byte-map fmt-${format}`;
  map.replaceChildren(
    ...regions.map((r, i) => {
      const share = (r.end - r.start) / total;
      const b = el("button", {
        type: "button",
        className: `k-${r.kind}`,
        title: `${r.label} · ${r.kind} · offset ${r.start} · ${size(r.end - r.start)}`,
        textContent: share > 0.08 ? r.label : "",
      });
      b.style.flex = `${Math.max(share, 0.02)} 1 0`;
      b.dataset.region = String(i);
      b.setAttribute("aria-label", `${r.label}, ${r.kind}, bytes ${r.start} to ${r.end - 1}`);
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => select(i));
      return b;
    }),
  );
  $("legend").className = `legend fmt-${format}`; // the format color for the legend swatches
  $("legend").replaceChildren(
    ...KINDS.filter(([k]) => regions.some((r) => r.kind === k)).map(([k, text]) => el("span", {}, el("i", { className: `k-${k}` }), text)),
  );
  $("structure").replaceChildren(
    ...regions.map((r) => 
      el("tr", { className: "table-row" },
        el("td", { className: "table-cell" }, el("code", { textContent: r.label })),
        el("td", { className: "table-cell", textContent: r.kind }),
        el("td", { className: "table-cell mono", textContent: `${r.start} (${hex(r.start)})` }),
        el("td", { className: "table-cell mono", textContent: size(r.end - r.start) }),
      ),
    ),
  );
}

async function select(i: number) {
  if (!current) return;
  const r = current.regions[i];
  for (const b of $("byte-map").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.region === String(i)));
  const bytes = new Uint8Array(await current.file.slice(r.start, Math.min(r.end, r.start + 256)).arrayBuffer());
  const lines: string[] = [];
  for (let p = 0; p < bytes.length; p += 16) {
    const row = bytes.subarray(p, p + 16);
    const hexes = [...row].map((x) => x.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const ascii = [...row].map((x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : ".")).join("");
    lines.push(`${(r.start + p).toString(16).padStart(8, "0")}  ${hexes}  ${ascii}`);
  }
  $("region-title").textContent = `${r.label} · ${r.kind} · bytes ${r.start}–${r.end - 1} (${size(r.end - r.start)})`;
  $("hex").textContent = lines.join("\n") + (r.end - r.start > 256 ? "\n…" : "");
}

function nerds(r: ReadResult) {
  const replacer = (_k: string, v: unknown) => (typeof v === "bigint" ? `${v}n` : v instanceof Uint8Array ? `<${v.length} bytes>` : v);
  $("dump").textContent = JSON.stringify(r, replacer, 2);
  $("warning-list").replaceChildren(
    ...(r.warnings.length
      ? r.warnings.map((w) => el("li", {}, el("span", { className: "badge", textContent: w.code }), " ", w.message))
      : [el("li", { textContent: "No warnings: the file follows its spec." })]),
  );
  $("warning-count").textContent = String(r.warnings.length);
}

// ---- pictures -------------------------------------------------------------------------------------------

const PICTURE_FORMATS: Record<string, string> = { "image/jpeg": "JPEG", "image/jpg": "JPEG", "image/png": "PNG", "image/gif": "GIF", "image/webp": "WebP", "image/bmp": "BMP" };

// Shows picture i (wrapping around) at its natural aspect ratio, with its pixel size, format, byte size and
// picture type; the pixel size is known only once the browser has decoded the image.
function showPicture(i: number) {
  const pictures = current?.result.metadata.pictures ?? [];
  if (!pictures.length) return;
  shownPicture = (i + pictures.length) % pictures.length;
  const pic = pictures[shownPicture];
  const img = $<HTMLImageElement>("cover");
  const facts = [
    PICTURE_FORMATS[pic.mimeType.toLowerCase()] ?? pic.mimeType,
    size(pic.data.length),
    PICTURE_TYPES[pic.type] ?? `type ${pic.type}`,
    ...(pic.description ? [`"${pic.description}"`] : []),
  ];
  $("cover-info").textContent = facts.join(" · ");
  img.alt = `${PICTURE_TYPES[pic.type] ?? "Picture"}${pic.description ? `: ${pic.description}` : ""}`;
  img.onload = () => {
    $("cover-info").textContent = [`${img.naturalWidth} × ${img.naturalHeight} px`, ...facts].join(" · ");
    img.classList.toggle("tiny", img.naturalHeight < 48); // enlarged to the 3rem minimum: keep the pixels sharp
  };
  img.src = objectUrl(new Blob([pic.data as BlobPart], { type: pic.mimeType }));
  $("cover-count").textContent = `${shownPicture + 1} of ${pictures.length}`;
}

// ---- open, edit, save ----------------------------------------------------------------------------------

async function load(file: File) {
  let result: ReadResult;
  try {
    result = await readFromBlob(file);
  } catch (e: any) {
    toast({ title: `Can't read ${file.name}`, description: e.message, variant: "destructive" });
    return;
  }
  for (const u of urls) URL.revokeObjectURL(u);
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
  if (pictures.length) showPicture(Math.max(0, pictures.findIndex((p) => p.type === 3))); // the front cover first
  facts(file, result);
  fill(result.metadata);
  drawByteMap(regions, file.size, result.format);
  nerds(result);
  select(Math.max(0, regions.findIndex((r) => r.kind === "tag")));
}

// The fields of the form that differ from the file: unchanged fields keep their bytes, emptied ones go (null).
function update(): Record<string, unknown> {
  const f = ($("editor") as HTMLFormElement).elements as any;
  const old = current!.result.metadata;
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const m: Record<string, unknown> = {};
  const set = (key: string, value: unknown, before: unknown) => {
    if (JSON.stringify(value ?? null) !== JSON.stringify(before ?? null)) m[key] = value ?? null;
  };
  set("title", f.title.value.trim() || undefined, old.title);
  set("artist", list(f.artist.value).length ? list(f.artist.value) : undefined, old.artist);
  set("albumArtist", f.albumArtist.value.trim() || undefined, old.albumArtist);
  set("album", f.album.value.trim() || undefined, old.album);
  set("genre", list(f.genre.value).length ? list(f.genre.value) : undefined, old.genre);
  set("recordingTime", f.recordingTime.value.trim() || undefined, old.recordingTime);
  const no = f.track.value ? Number(f.track.value) : undefined;
  const of = f.tracks.value ? Number(f.tracks.value) : undefined;
  if (no !== old.track?.no || of !== old.track?.of) m.track = no || of ? { no, of } : null;
  const text = f.comment.value;
  if (text !== (old.comments?.[0]?.text ?? "")) {
    const rest = old.comments?.slice(1) ?? [];
    m.comments = text
      ? [{ language: old.comments?.[0]?.language ?? "eng", description: old.comments?.[0]?.description ?? "", text }, ...rest]
      : rest.length ? rest : null;
  }
  return m;
}

const unsaved = () => !!current && (Object.keys(update()).length > 0 || ($("f-cover") as HTMLInputElement).files!.length > 0 || $<HTMLInputElement>("f-nocover").checked);

// Asks before unsaved changes are thrown away; resolves to true when it is fine to go on.
function confirmDiscard(action: string): Promise<boolean> {
  if (!unsaved()) return Promise.resolve(true);
  const dialog = $<HTMLDialogElement>("discard-dialog");
  $("discard-desc").textContent = `You changed tags in ${current!.file.name} that are not saved yet. ${action} discards these changes.`;
  return new Promise((resolve) => {
    const answer = (e: Event) => {
      const button = (e.target as HTMLElement).closest<HTMLElement>("[data-answer]");
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

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (await confirmDiscard("Opening another file")) load(file);
  else input.value = "";
}

async function onSave(e: Event) {
  e.preventDefault();
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
    const out = await writeToBlob(current.file, { metadata: metadata as any });
    el("a", { href: objectUrl(out), download: out.name }).click();
    await load(out); // read it back, so you see what was written
    toast({ title: `Saved ${out.name}`, description: `Changed ${changed.join(", ")}. ${size(out.size)}.`, variant: "success" });
  } catch (err: any) {
    toast({ title: "Not saved", description: err.message, variant: "destructive", duration: 8000 });
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
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const dv = new DataView(buf);
  const ascii = (pos: number, s: string) => [...s].forEach((c, i) => dv.setUint8(pos + i, c.charCodeAt(0)));
  ascii(0, "RIFF"); dv.setUint32(4, 36 + samples.length * 2, true); ascii(8, "WAVE");
  ascii(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  ascii(36, "data"); dv.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return new File([buf], name, { type: "audio/wav" });
}

// When there is no microphone: a half-second 440 Hz tone.
const testTone = () => {
  const rate = 8000, n = rate / 2;
  return wavFile(Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 440 * i) / rate) * 0.25 * Math.min(1, (n - i) / 400)), rate, "sample.wav");
};

// An AudioWorklet copies the raw samples, which become a WAV file on stop (MediaRecorder would give WebM).
const MAX_SECONDS = 30;
const TAP = "registerProcessor('tap', class extends AudioWorkletProcessor { process(inputs) { const c = inputs[0][0]; if (c) this.port.postMessage(c.slice(0)); return true } })";
let recording: { stream: MediaStream; ctx: AudioContext; chunks: Float32Array[]; timer: ReturnType<typeof setInterval> } | undefined;

function setRecordButton(text: string, active: boolean) {
  $("record-label").textContent = text;
  $("record").setAttribute("data-variant", active ? "destructive" : "outline");
  $("record").setAttribute("aria-pressed", String(active));
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const ctx = new AudioContext();
  const module = URL.createObjectURL(new Blob([TAP], { type: "text/javascript" }));
  await ctx.audioWorklet.addModule(module);
  URL.revokeObjectURL(module);
  const tap = new AudioWorkletNode(ctx, "tap");
  const silent = ctx.createGain();
  silent.gain.value = 0; // the tap must reach the destination to run, but nothing is played back
  const chunks: Float32Array[] = [];
  tap.port.onmessage = (e) => chunks.push(e.data);
  ctx.createMediaStreamSource(stream).connect(tap).connect(silent).connect(ctx.destination);
  const started = performance.now();
  const tick = () => {
    const s = (performance.now() - started) / 1000;
    if (s >= MAX_SECONDS) return void stopRecording();
    setRecordButton(`Stop recording · ${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, "0")}`, true);
  };
  recording = { stream, ctx, chunks, timer: setInterval(tick, 250) };
  tick();
}

async function stopRecording() {
  const { stream, ctx, chunks, timer } = recording!;
  recording = undefined;
  clearInterval(timer);
  for (const t of stream.getTracks()) t.stop();
  await ctx.close();
  setRecordButton("No file at hand? Record with your mic", false);
  const samples = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let pos = 0;
  for (const c of chunks) { samples.set(c, pos); pos += c.length; }
  if (!samples.length) {
    toast({ title: "Nothing was recorded", description: "The microphone sent no sound. Try again.", variant: "warning" });
    return;
  }
  const d = new Date();
  const two = (n: number) => String(n).padStart(2, "0");
  load(wavFile(samples, ctx.sampleRate, `recording-${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}.wav`));
}

async function onRecord() {
  if (recording) return stopRecording();
  if (!(await confirmDiscard("Recording a new file"))) return;
  const button = $<HTMLButtonElement>("record");
  button.disabled = true;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("this browser has no microphone access here (it needs https or localhost)");
    await startRecording();
  } catch (e: any) {
    const blocked = e.name === "NotAllowedError";
    toast({ title: blocked ? "Microphone blocked" : "No microphone", description: `${blocked ? "Allow the microphone in your browser to record" : e.message}. Here is a test tone instead.`, variant: "warning", duration: 8000 });
    load(testTone());
  } finally {
    button.disabled = false;
  }
}

if (typeof window !== "undefined") addEventListener("beforeunload", (e) => { if (unsaved()) e.preventDefault(); });

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
