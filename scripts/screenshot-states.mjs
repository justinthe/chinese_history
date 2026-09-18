// Captures mockup states the generic [data-screen] script cannot reach:
// the Grand Tour docked panel, the search results dropdown, and the mobile layout.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const url = pathToFileURL(resolve("mockup.html")).href;
const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktop.goto(url, { waitUntil: "networkidle" });
await desktop.evaluate(() => { go("explore"); startTour(); });
await desktop.waitForTimeout(800);
await desktop.screenshot({ path: "images/screen-05-grand-tour.png" });

await desktop.evaluate(() => { endTour(); });
await desktop.fill("#q", "paper");
await desktop.waitForTimeout(300);
await desktop.screenshot({ path: "images/screen-06-search.png" });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(url, { waitUntil: "networkidle" });
await mobile.evaluate(() => { go("explore"); startTour(); });
await mobile.waitForTimeout(800);
await mobile.screenshot({ path: "images/screen-07-explore-mobile.png" });

await browser.close();
console.log("done");
