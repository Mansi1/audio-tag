// RowList (hydrated): an editable list of rows, one box per row with a remove button, for repeated tags like
// comments and stored frames. Rows are plain records of strings that the caller converts to and from metadata; a
// row's controls write into its record as you type, so the caller reads the records on save. A column can pick its
// control per row and follow another column: the value of a binary ID3 frame is a HexInput, of a text frame a field.
// VERIFIED: make e2e adds, fills, removes and saves comment rows and stored frames through it.
import { render, type Props } from "defuss";
import { Combobox, type Options } from "./Combobox.js";
import { BytesInput, setBytes } from "./BytesInput.js";
import { HexInput } from "./HexInput.js";

export type Row = Record<string, string>;
type Control = "text" | "number" | "url" | "email" | "textarea" | "hex" | "bytes";

export interface Column {
  key: string;
  label: string;
  /** the control; a function picks it per row (see follows) */
  type?: Control | ((row: Row) => Control);
  /** the column whose changes may change this column's control: its cell is drawn again when the control changes */
  follows?: string;
  /** suggestions: the column becomes a Combobox that still takes any text */
  options?: Options;
  /** a CSS grid track, "1fr" by default; a textarea takes the whole row */
  width?: string;
  placeholder?: string;
  pattern?: string;
  maxlength?: number;
  min?: string;
  max?: string;
  title?: string;
}

const controlOf = (column: Column, row: Row): Control => (typeof column.type === "function" ? column.type(row) : column.type ?? "text");
const cellOf = (item: Element, column: Column) => item.querySelector<HTMLElement>(`:scope > .row-fields > [data-key="${column.key}"]`)!;

// Values go in as properties: attributes would only set the defaults.
function fillCell(cell: HTMLElement, row: Row, column: Column) {
  const bytes = cell.querySelector<HTMLElement>("[data-bytes-id]");
  if (bytes) return setBytes(bytes, row[column.key] ?? "");
  const control = cell.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  if (control) control.value = row[column.key] ?? "";
}

/** Renders the rows into list (an <ul>) and puts their values into the controls. */
export function drawRows(list: HTMLElement, rows: Row[], columns: Column[], noun: string) {
  const redraw = () => drawRows(list, rows, columns, noun);
  render(<>{rows.map((row, index) => <RowItem listId={list.id} row={row} index={index} columns={columns} noun={noun} onRemove={() => { rows.splice(index, 1); redraw(); }} />)}</>, list);
  [...list.children].forEach((item, index) => columns.forEach((column) => fillCell(cellOf(item, column), rows[index], column)));
}

/** Adds an empty row (with defaults) and focuses its first control. */
export function addRow(list: HTMLElement, rows: Row[], columns: Column[], noun: string, defaults: Row = {}) {
  rows.push({ ...Object.fromEntries(columns.map((column) => [column.key, ""])), ...defaults });
  drawRows(list, rows, columns, noun);
  list.querySelector<HTMLElement>(":scope > li:last-child input, :scope > li:last-child textarea")?.focus();
}

function Cell({ listId, row, index, column, noun, onChange }: Props & { listId: string; row: Row; index: number; column: Column; noun: string; onChange: () => void }) {
  const label = `${column.label} of ${noun} ${index + 1}`;
  const write = (value: string) => { row[column.key] = value; onChange(); };
  const control = controlOf(column, row);
  if (control === "textarea") {
    return <textarea class="textarea" rows={2} placeholder={column.placeholder ?? column.label} aria-label={label} onInput={(event: Event) => write((event.target as HTMLTextAreaElement).value)}></textarea>;
  }
  if (control === "hex") return <HexInput label={label} onValue={write} />;
  if (control === "bytes") return <BytesInput id={`${listId}-${column.key}-${index}`} label={label} onValue={write} />;
  if (column.options) {
    return <Combobox id={`${listId}-${column.key}-${index}`} label={label} options={column.options} onValue={write}
      placeholder={column.placeholder} pattern={column.pattern} maxlength={column.maxlength} title={column.title} />;
  }
  return <input class="input" type={control} placeholder={column.placeholder ?? column.label} aria-label={label} onInput={(event: Event) => write((event.target as HTMLInputElement).value)}
    pattern={column.pattern} maxlength={column.maxlength} min={column.min} max={column.max} title={column.title} />;
}

function RowItem({ listId, row, index, columns, noun, onRemove }: Props & { listId: string; row: Row; index: number; columns: Column[]; noun: string; onRemove: () => void }) {
  const tracks = columns.filter((column) => column.type !== "textarea").map((column) => column.width ?? "minmax(0, 1fr)").join(" ");
  const id = `${listId}-row-${index}`;
  // a change in one column draws the cells that follow it again, when their control changes
  const changed = (key: string) => {
    const item = document.getElementById(id);
    if (!item) return;
    for (const column of columns.filter((other) => other.follows === key)) {
      const cell = cellOf(item, column);
      if (cell.dataset.control === controlOf(column, row)) continue;
      cell.dataset.control = controlOf(column, row);
      // emptied first: render() would update the old control in place and keep attributes the new one lacks
      // (a text field kept the hex pattern and refused its text)
      cell.replaceChildren();
      render(<Cell listId={listId} row={row} index={index} column={column} noun={noun} onChange={() => changed(column.key)} />, cell);
      fillCell(cell, row, column);
    }
  };
  return (
    <li class="edit-row comment-row" id={id}>
      <div class="row-fields" style={`grid-template-columns: ${tracks}`}>
        {columns.map((column) => (
          <div class={`row-cell${controlOf(column, row) === "textarea" ? " wide" : ""}`} data-key={column.key} data-control={controlOf(column, row)}>
            <Cell listId={listId} row={row} index={index} column={column} noun={noun} onChange={() => changed(column.key)} />
          </div>
        ))}
      </div>
      <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label={`Remove ${noun} ${index + 1}`} onClick={onRemove}>✕</button>
    </li>
  );
}
