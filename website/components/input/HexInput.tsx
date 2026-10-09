// HexInput (hydrated): a text field for bytes as hex digits, like the value of a binary ID3 frame. It keeps only
// hex digits, groups them in pairs as you type ("0a1b2" shows "0a 1b 2") with the caret kept after the same digit,
// and is invalid while a byte lacks its second digit. It reports the formatted text through onValue.
// VERIFIED: make e2e types bytes with stray characters into it and saves them in a binary frame.
import type { Props } from "defuss";

export interface HexInputProps extends Props {
  label: string;
  onValue: (value: string) => void;
  placeholder?: string;
}

/** Lower-case hex digits in pairs: "0A1b 2" → "0a 1b 2". */
export const formatHex = (text: string) => (text.replace(/[^0-9a-fA-F]/g, "").toLowerCase().match(/.{1,2}/g) ?? []).join(" ");

// Re-formats the field and puts the caret after the digit it followed: the n-th digit ends at n + ⌊(n - 1) / 2⌋.
function reformat(input: HTMLInputElement) {
  const digitsBefore = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/[^0-9a-fA-F]/g, "").length;
  input.value = formatHex(input.value);
  const caret = digitsBefore === 0 ? 0 : digitsBefore + Math.floor((digitsBefore - 1) / 2);
  input.setSelectionRange(caret, caret);
}

export function HexInput({ label, onValue, placeholder = "6d 65 00 01" }: HexInputProps) {
  return (
    <input class="input hex-input" type="text" spellcheck={false} autocomplete="off" aria-label={label} placeholder={placeholder}
      pattern="[0-9a-f]{2}( [0-9a-f]{2})*" title="Bytes as pairs of hex digits, like 6d 65 00 01"
      onInput={(event: Event) => { const input = event.target as HTMLInputElement; reformat(input); onValue(input.value); }} />
  );
}
