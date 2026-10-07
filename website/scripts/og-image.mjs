// Renders the link preview (WhatsApp, Slack, social sites) from the README banner into assets/og.jpg:
// 1200 × 630, the size these sites show as a large card. HYPOTHESIS: they show no SVG previews and WhatsApp skips
// images above about 300 KB (falsifier: a shared link with an SVG or larger image showing a picture), hence JPEG.
// Run after changing the banner: node scripts/og-image.mjs (in website/; uses the root's Playwright).
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const banner = readFileSync(new URL("../../.github/readme/banner.svg", import.meta.url), "utf8");
const out = new URL("../assets/og.jpg", import.meta.url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(`<!doctype html><html><body style="margin:0;width:1200px;height:630px;display:grid;place-items:center;
  background:linear-gradient(135deg,#0f172a,#1e1b4b)">${banner
  .replace(/<svg /, '<svg style="width:1200px;height:auto;display:block" ')
  // the page draws the background, so the banner's rounded card does not show as a box
  .replace('<rect width="960" height="300" rx="20" fill="url(#bg)"/>', "")}</body></html>`);
await page.screenshot({ path: out, type: "jpeg", quality: 90 });
await browser.close();
console.log(`${new Date().toISOString()} INFO wrote the link preview path=${out}`);
