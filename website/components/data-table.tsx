// A table with a filter box (hydrated): every row whose text contains all the typed words stays visible.
// VERIFIED: the rows are rendered at build time, so the table reads without JavaScript; the island only filters.
import type { Props } from "defuss";

export interface DataTableProps extends Props {
  id: string;
  caption: string;
  columns: string[];
  rows: string[][];
  placeholder: string;
}

export function DataTable({ id, caption, columns, rows, placeholder }: DataTableProps) {
  const filter = (e: Event) => {
    const words = (e.target as HTMLInputElement).value.toLowerCase().split(/\s+/).filter(Boolean);
    for (const tr of document.querySelectorAll<HTMLTableRowElement>(`#${id} tbody tr`)) {
      const text = tr.textContent!.toLowerCase();
      tr.hidden = !words.every((w) => text.includes(w));
    }
  };
  return (
    <div>
      <input class="input filter" type="search" placeholder={placeholder} aria-label={`Filter: ${caption}`} aria-controls={id} onInput={filter} />
      <div class="table-scroll">
        <table class="table" id={id}>
          <caption class="table-caption">{caption}</caption>
          <thead>
            <tr class="table-row">{columns.map((c) => <th class="table-head">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => <tr class="table-row">{r.map((c, i) => <td class="table-cell">{i > 0 && /^[A-Z0-9 ]{3,4}( §|$)/.test(c) ? <code>{c}</code> : c}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
