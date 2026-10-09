// Other tags (hydrated): the file's stored tags that the main form does not show, as editable rows of frame ID,
// description and value (lib/raw-tags.ts reads and writes them), after Pictures. ID3 frames that are not text hold
// hex bytes, and what they hold is listed below the rows in readable form; frames that cannot be edited are only listed. The playground calls fillOtherTags when a file opens and, on save,
// passes otherTagsWrite with its metadata; untouched rows write nothing, so the file keeps its bytes.
// VERIFIED: make e2e adds frames with IDs and descriptions in an MP3 and an item in an M4A, saves and reads them back.
import { render } from "defuss";
import type { ReadResult, WriteInput } from "audio-tag/browser";
import { ChevronIcon } from "./icon/ChevronIcon.js";
import { addRow, drawRows, type Column, type Row } from "./input/RowList.js";
import { readRaw, writeRaw, type RawRow, type RawTags } from "../lib/raw-tags.js";

const $ = (id: string) => document.getElementById(id)!;
let raw: RawTags | undefined;
let rows: Row[] = [];
let initial = "";

function columns(tags: RawTags): Column[] {
  return [
    { key: "id", label: "ID", options: tags.ids, width: tags.kind === "mp4" ? "minmax(0, 2fr)" : "7.5rem", placeholder: tags.ids[0]?.[0], pattern: tags.idPattern, title: tags.idTitle },
    ...(tags.kind === "id3" ? [{ key: "description", label: "Description", width: "minmax(0, 1fr)" }] : []),
    // text for a text frame, hex bytes for a binary one, and TEXT or BYTE for an ID no spec defines; it follows the
    // ID as you type or pick it
    { key: "value", label: "Value", width: "minmax(0, 2fr)", type: (row) => (tags.unknown(row.id ?? "") ? "bytes" : tags.binary(row.id ?? "") ? "hex" : "text"), follows: "id" },
  ];
}

// The rows that would be stored: rows without an ID or a value are left out, as writeRaw does.
const stored = (list: Row[]): RawRow[] =>
  list.filter((row) => row.id?.trim() && row.value?.trim()).map((row) => ({ id: row.id, description: row.description ?? "", value: row.value }));

/** Shows the file's stored tags. */
export function fillOtherTags(result: ReadResult) {
  raw = readRaw(result);
  rows = raw.rows.map((row) => ({ ...row }));
  initial = JSON.stringify(stored(rows));
  drawRows($("raw-list"), rows, columns(raw), "frame");
  render(<>{raw.fixed.map((line) => <li><code>{line.split(" · ")[0]}</code> {line.split(" · ").slice(1).join(" · ")}</li>)}</>, $("raw-fixed"));
  $("raw-fixed-box").hidden = !raw.fixed.length;
  $("raw-desc").textContent = `The ${raw.title} of this file, one row per value. Title, artist, album, genre, dates, track, comments and pictures are edited above.`
    + (raw.described.length ? ` A description belongs to ${raw.described.join(" and ")} only. Frames marked (BYTE) in the ID list, like PRIV, hold hex bytes; an ID no spec defines, like an experimental X…, holds TEXT or BYTE as you choose.` : "");
  const count = raw.rows.length + raw.listed;
  $("other-count").textContent = count ? `· ${count}` : "";
}

/** True when a row was edited, added or removed. */
export const otherTagsChanged = () => !!raw && JSON.stringify(stored(rows)) !== initial;

/** The write input that stores the rows, or nothing when they are unchanged. Throws for IDs it cannot write. */
export function otherTagsWrite(result: ReadResult): Partial<WriteInput> {
  return otherTagsChanged() ? writeRaw(result, stored(rows)) : {};
}

export function OtherTags() {
  return (
    <div class="accordion wide">
      <details class="accordion-item" id="other-tags">
        <summary class="accordion-trigger"><span>Other tags <span class="other-count" id="other-count"></span></span><ChevronIcon /></summary>
        <div class="accordion-content other-tags">
          <p class="field-description" id="raw-desc"></p>
          <ul class="edit-list" id="raw-list"></ul>
          <button class="btn" data-variant="outline" data-size="sm" type="button" id="add-frame"
            onClick={() => raw && addRow($("raw-list"), rows, columns(raw), "frame")}>Add frame</button>
          <div id="raw-fixed-box" hidden>
            <p class="field-description">What the frames that are not text hold:</p>
            <ul class="raw-fixed" id="raw-fixed"></ul>
          </div>
        </div>
      </details>
    </div>
  );
}
