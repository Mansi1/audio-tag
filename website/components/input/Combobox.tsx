// Combobox (hydrated): a text field styled like .input with a list that opens like a select (site.css .combo-list).
// It reports every typed or picked value through onValue; the caller sets the shown value as a property after
// render. VERIFIED: make e2e opens it with a click, filters, picks with Enter and the mouse, and keeps free text.
import type { Props } from "defuss";
import { CheckIcon } from "../icon/CheckIcon.js";
import { ChevronIcon } from "../icon/ChevronIcon.js";

/** [value, label] pairs */
export type Options = [string, string][];

export interface ComboboxProps extends Props {
  /** id of the list; options get `${id}-${index}` (values may hold spaces, which an id cannot) */
  id: string;
  label: string;
  /** shown as value, then label (an empty label shows the value alone); typing filters on both */
  options: Options;
  onValue?: (value: string) => void;
  /** a list of values in one field, like "Rock, Pop": filtering and picking act on the part after the last one */
  separator?: string;
  /** for a <label for>, a form field name and a hint */
  inputId?: string;
  name?: string;
  describedBy?: string;
  placeholder?: string;
  maxlength?: number;
  pattern?: string;
  title?: string;
  /** only the listed values: leaving the field completes a match (any case) or puts the last valid value back */
  strict?: boolean;
}

// It opens the whole list on click or arrow key like a select, filters while typing and keeps whatever is typed.
// A <datalist> took free text too, but did not open like a select (HYPOTHESIS from Chrome's behavior: only from its
// own arrow, listing only entries that match the current value).
export function Combobox({ id, label, options, onValue, separator, inputId, name, describedBy, placeholder, maxlength, pattern, title, strict }: ComboboxProps) {
  const pick = (input: HTMLInputElement, value: string) => {
    input.value = separator ? [...input.value.split(separator).slice(0, -1).map((part) => part.trim()).filter(Boolean), value].join(`${separator} `) : value;
    onValue?.(input.value);
    remember(input);
    close(input);
  };
  return (
    <span class="select combo">
      <input
        class="input" type="text" id={inputId} name={name} placeholder={placeholder} maxlength={maxlength} pattern={pattern} autocomplete="off" title={title}
        role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls={id} aria-label={label} aria-describedby={describedBy} data-separator={separator}
        onClick={(event: Event) => open(event.target as HTMLInputElement, "")}
        onInput={(event: Event) => { const input = event.target as HTMLInputElement; onValue?.(input.value); if (strict) remember(input); open(input, input.value); }}
        onKeyDown={(event: KeyboardEvent) => onKey(event, pick)}
        onFocus={(event: Event) => strict && remember(event.target as HTMLInputElement)}
        onBlur={(event: Event) => {
          const input = event.target as HTMLInputElement;
          close(input);
          if (strict) settle(input, onValue);
        }}
      />
      {/* the arrow opens and closes the list like a select's; aria-hidden, since the field itself takes the keys */}
      <span class="combo-toggle" aria-hidden="true" onMouseDown={(event: Event) => {
        event.preventDefault(); // keep the focus in the field, so it does not close the list on blur
        const input = (event.target as HTMLElement).closest(".combo")!.querySelector("input")!;
        if (input.getAttribute("aria-expanded") === "true") return close(input);
        input.focus();
        open(input, "");
      }}>
        <ChevronIcon class="select-chevron" />
      </span>
      <ul class="combo-list" role="listbox" id={id} aria-label={label} {...{ popover: "manual" } /* not in the defuss JSX types yet */}>
        {options.map(([value, text], index) => (
          // defuss delegates events: event.currentTarget is not this element, event.target is inside it
          <li role="option" id={`${id}-${index}`} data-value={value} data-search={`${value} ${text}`.toLowerCase()} aria-selected="false"
            onMouseDown={(event: Event) => { event.preventDefault(); pick((event.target as HTMLElement).closest(".combo")!.querySelector("input")!, value); }}>
            {text ? <><code>{value}</code><span>{text}</span></> : <span>{value}</span>}
            <CheckIcon class="combo-check" />
          </li>
        ))}
      </ul>
    </span>
  );
}

const list = (input: HTMLInputElement) => document.getElementById(input.getAttribute("aria-controls")!)!;

// A strict field: the listed value its text names, ignoring case and spaces around it.
const listed = (input: HTMLInputElement, text: string) =>
  [...list(input).querySelectorAll<HTMLElement>("[role=option]")].map((option) => option.dataset.value!).find((value) => value.toLowerCase() === text.trim().toLowerCase());

// The value to go back to: kept whenever the field holds a listed value (on focus, when picked or typed in full).
function remember(input: HTMLInputElement) {
  const value = listed(input, input.value);
  if (value !== undefined) input.dataset.valid = value;
}

// Leaving a strict field: a listed value in any case becomes that value; anything else, the value it had before.
function settle(input: HTMLInputElement, onValue?: (value: string) => void) {
  const value = listed(input, input.value) ?? input.dataset.valid;
  if (value === undefined || value === input.value) return;
  input.value = value;
  onValue?.(value);
}
const shown = (input: HTMLInputElement) => [...list(input).querySelectorAll<HTMLElement>("[role=option]:not([hidden])")];

// The part of the field the list is about: all of it, or the part after the last separator.
const lastPart = (input: HTMLInputElement, text: string) => (input.dataset.separator ? text.split(input.dataset.separator).at(-1)! : text).trim().toLowerCase();

// The values in the field, lower case: one, or each part between separators.
const chosen = (input: HTMLInputElement) =>
  (input.dataset.separator ? input.value.split(input.dataset.separator) : [input.value]).map((part) => part.trim().toLowerCase()).filter(Boolean);

function open(input: HTMLInputElement, filter: string) {
  const query = lastPart(input, filter);
  // the check mark: the values already in the field, like a select marks its selected option
  const checked = new Set(chosen(input));
  for (const option of list(input).querySelectorAll<HTMLElement>("[role=option]")) option.toggleAttribute("data-checked", checked.has(option.dataset.value!.toLowerCase()));
  for (const option of list(input).querySelectorAll<HTMLElement>("[role=option]")) option.hidden = !!query && !option.dataset.search!.includes(query);
  const options = shown(input);
  show(input, options.length > 0);
  input.setAttribute("aria-expanded", String(options.length > 0));
  const value = (option: HTMLElement) => option.dataset.value!.toLowerCase();
  const current = options.find((option) => value(option) === lastPart(input, input.value));
  // a typed query marks the first value starting with it, so "rock" + Enter picks Rock, not Alternative Rock
  activate(input, current ?? (query ? options.find((option) => value(option).startsWith(query)) ?? options[0] : undefined));
}

function activate(input: HTMLInputElement, option?: HTMLElement) {
  for (const other of list(input).querySelectorAll("[aria-selected=true]")) other.setAttribute("aria-selected", "false");
  if (!option) return void input.removeAttribute("aria-activedescendant");
  option.setAttribute("aria-selected", "true");
  option.scrollIntoView({ block: "nearest" });
  input.setAttribute("aria-activedescendant", option.id);
}

// The list opens as a popover: in the top layer no ancestor's overflow clips it (the form card and the "Other tags"
// accordion hide overflow, and cut a list that hung below or beside them). It is placed at the field by hand and
// follows it while the page scrolls or resizes.
const PLACE = new WeakMap<HTMLElement, () => void>();

function show(input: HTMLInputElement, visible: boolean) {
  const element = list(input);
  const isOpen = element.matches(":popover-open");
  if (!visible) {
    if (isOpen) element.hidePopover();
    const place = PLACE.get(element);
    if (place) { removeEventListener("scroll", place, true); removeEventListener("resize", place); PLACE.delete(element); }
    return;
  }
  if (!isOpen) element.showPopover();
  if (!PLACE.has(element)) {
    const place = () => position(input, element);
    PLACE.set(element, place);
    addEventListener("scroll", place, true);
    addEventListener("resize", place);
  }
  position(input, element);
}

// Below the field, left-aligned and at least as wide; inside the window; above the field when there is more room.
function position(input: HTMLInputElement, element: HTMLElement) {
  const field = input.getBoundingClientRect();
  const margin = 8;
  const below = innerHeight - field.bottom - margin;
  const above = field.top - margin;
  const up = below < 160 && above > below;
  element.style.minWidth = `${field.width}px`;
  element.style.maxHeight = `${Math.max(96, Math.min(208, (up ? above : below) - 4))}px`;
  element.style.left = `${Math.max(margin, Math.min(field.left, innerWidth - element.offsetWidth - margin))}px`;
  element.style.top = up ? "auto" : `${field.bottom + 4}px`;
  element.style.bottom = up ? `${innerHeight - field.top + 4}px` : "auto";
}

function close(input: HTMLInputElement) {
  show(input, false);
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
}

function onKey(event: KeyboardEvent, pick: (input: HTMLInputElement, value: string) => void) {
  const input = event.target as HTMLInputElement;
  const isOpen = input.getAttribute("aria-expanded") === "true";
  const options = shown(input);
  const active = options.findIndex((option) => option.id === input.getAttribute("aria-activedescendant"));
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!isOpen) return open(input, "");
    const step = event.key === "ArrowDown" ? 1 : -1;
    activate(input, options[active < 0 ? (step > 0 ? 0 : options.length - 1) : (active + step + options.length) % options.length]);
  } else if (event.key === "Enter" && isOpen && active >= 0) {
    event.preventDefault(); // pick, don't submit the form
    pick(input, options[active].dataset.value!);
  } else if (event.key === "Escape" && isOpen) {
    event.preventDefault();
    close(input);
  }
}
