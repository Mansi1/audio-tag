// The library build this site documents: version, commit, build time and output sizes, as written by
// the library's build (tsup.config.ts, scripts/minify.mjs). The one place the site reads it from.
// VERIFIED: a relative import from lib/pages/ broke, since defuss-ssg copies lib/ into .ssg-temp/.
import info from "../../dist/build-info.json";

export { info as buildInfo };
