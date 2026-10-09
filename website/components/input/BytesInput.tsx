// BytesInput (hydrated): bytes typed either as text or as hex, chosen with TEXT / BYTE in front of the field, for
// the value of a frame no spec defines (an experimental XABC). The value is always the bytes, as hex: TEXT shows them
// as UTF-8 and stores what is typed as UTF-8, BYTE is a HexInput. Switching keeps the bytes; TEXT is refused for
// bytes that are not readable text, so nothing is lost. setBytes fills it and picks the mode that shows the bytes.
// VERIFIED: make e2e stores a string and hex bytes in experimental frames through it, and switches between them.
import { render, type Props } from "defuss";
import { Combobox } from "./Combobox.js";
import { HexInput } from "./HexInput.js";
import { hexOfText, textOfHex } from "../../lib/raw-tags.js";

type Mode = "TEXT" | "BYTE";
const MODES: [string, string][] = [["TEXT", "a string, as UTF-8"], ["BYTE", "hex bytes"]];
// what each field reports its bytes to, by the field's id (set while it renders)
const report = new Map<string, (hex: string) => void>();

const field = (id: string) => document.querySelector<HTMLElement>(`[data-bytes-id="${id}"]`);

// Shows the bytes in a mode: the chooser says which, the value field is drawn for it (emptied first, as render()
// would otherwise keep the old field's attributes).
function show(container: HTMLElement, mode: Mode) {
  const id = container.dataset.bytesId!;
  const hex = container.dataset.hex ?? "";
  container.dataset.mode = mode;
  container.querySelector<HTMLInputElement>(":scope > .combo > input")!.value = mode;
  const slot = container.querySelector<HTMLElement>(":scope > .bytes-value")!;
  const keep = (bytes: string) => { container.dataset.hex = bytes; report.get(id)?.(bytes); };
  slot.replaceChildren();
  if (mode === "BYTE") render(<HexInput label={`Bytes of ${container.dataset.label}`} onValue={keep} />, slot);
  else render(<input class="input" type="text" aria-label={`Text of ${container.dataset.label}`} placeholder="Text" onInput={(event: Event) => keep(hexOfText((event.target as HTMLInputElement).value))} />, slot);
  slot.querySelector<HTMLInputElement>("input")!.value = mode === "BYTE" ? hex : textOfHex(hex) ?? "";
}

/** Fills the field with bytes (hex) and shows them as text when they are readable text, else as hex. */
export function setBytes(container: HTMLElement, hex: string) {
  container.dataset.hex = hex;
  show(container, textOfHex(hex) !== undefined ? "TEXT" : "BYTE");
}

function choose(id: string, mode: string) {
  const container = field(id);
  if (!container || (mode !== "TEXT" && mode !== "BYTE") || mode === container.dataset.mode) return;
  // TEXT only for bytes that read as text; otherwise the chooser goes back to BYTE
  show(container, mode === "TEXT" && textOfHex(container.dataset.hex ?? "") === undefined ? "BYTE" : mode);
}

export function BytesInput({ id, label, onValue }: Props & { id: string; label: string; onValue: (hex: string) => void }) {
  report.set(id, onValue);
  return (
    <div class="bytes-input" data-bytes-id={id} data-label={label}>
      <Combobox id={`${id}-mode`} label={`TEXT or BYTE for ${label}`} options={MODES} pattern="TEXT|BYTE" maxlength={4} strict
        title="TEXT: a string, stored as UTF-8. BYTE: hex bytes." onValue={(mode) => choose(id, mode.trim().toUpperCase())} />
      <span class="bytes-value"></span>
    </div>
  );
}
