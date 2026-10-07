// Where each metadata field is written in each format (server only), from data/support.json, which
// scripts/support-matrix.mjs finds by writing each field into an empty tag with the library itself.
// VERIFIED: static (not filterable): 38 rows fit on a page.
import support from "../data/support.json";

export function MappingTable() {
  const { formats, rows } = support.mapping;
  return (
    <div class="table-scroll">
      <table class="table" id="mapping-table">
        <caption class="table-caption">“n/a”: the format has no place for the field, and a write refuses it.</caption>
        <thead>
          <tr class="table-row"><th class="table-head">Field</th>{formats.map((f) => <th class="table-head">{f}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr class="table-row">
              <td class="table-cell"><code>{r.field}</code></td>
              {r.places.map((p) => <td class="table-cell">{p.length ? p.map((id) => <code>{id} </code>) : "n/a"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
