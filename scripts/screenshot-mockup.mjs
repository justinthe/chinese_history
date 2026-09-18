#!/usr/bin/env node
/**
 * screenshot-mockup.mjs
 * Renders mockup.html and screenshots every [data-screen] container
 * into images/screen-NN-<name>.png (DOM order).
 *
 * Usage:  node screenshot-mockup.mjs [path/to/mockup.html] [outputDir]
 * Defaults: ./mockup.html  ./images
 *
 * Requires Node 18+. Playwright + its Chromium browser are installed
 * AUTOMATICALLY on first run if missing. To opt out of auto-install
 * (e.g. in CI), set VIBE_NO_AUTOINSTALL=1 and install manually:
 *   npm i -D playwright && npx playwright install chromium
 */

import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const mockupPath = resolve(process.argv[2] || "mockup.html");
const outDir = resolve(process.argv[3] || "images");

if (!existsSync(mockupPath)) {
  console.error(`Mockup not found: ${mockupPath}`);
  process.exit(1);
}

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

// Load Playwright, auto-installing the package and Chromium if needed.
async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    if (process.env.VIBE_NO_AUTOINSTALL) {
      console.error(
        "Playwright not installed and VIBE_NO_AUTOINSTALL is set. Run:\n  npm i -D playwright && npx playwright install chromium"
      );
      process.exit(1);
    }
    console.log("Playwright not found — installing it now (one-time setup)…");
    try {
      sh("npm install -D playwright");
    } catch {
      console.error(
        "Auto-install of the playwright package failed. Install it manually:\n  npm i -D playwright && npx playwright install chromium\nthen re-run this script. (Or screenshot the screens manually — see storyboard.md for filenames.)"
      );
      process.exit(1);
    }
    return (await import("playwright")).chromium;
  }
}

let chromium = await loadChromium();

// Ensure the Chromium browser binary is present; launch, and if it's
// missing, install browsers once and retry.
async function launchChromium() {
  try {
    return await chromium.launch();
  } catch (err) {
    const msg = String(err?.message || err);
    const looksLikeMissingBrowser =
      /Executable doesn'?t exist|playwright install|Failed to launch/i.test(msg);
    if (looksLikeMissingBrowser && !process.env.VIBE_NO_AUTOINSTALL) {
      console.log("Chromium browser not found — installing it now (one-time, ~150 MB)…");
      try {
        sh("npx playwright install chromium");
      } catch {
        console.error(
          "Auto-install of Chromium failed. Install it manually:\n  npx playwright install chromium\nthen re-run. (Or screenshot the screens manually — see storyboard.md for filenames.)"
        );
        process.exit(1);
      }
      // Re-import in case the install changed resolution, then retry once.
      chromium = (await import("playwright")).chromium;
      try {
        return await chromium.launch();
      } catch {
        console.error(
          "\nCouldn't launch Chromium even after attempting install (the browser download may be blocked by your network).\nInstall it manually where downloads are allowed:\n  npx playwright install chromium\nthen re-run this script — or screenshot each screen manually using the filenames in storyboard.md. The pipeline can continue either way."
        );
        process.exit(2);
      }
    }
    throw err;
  }
}

mkdirSync(outDir, { recursive: true });

const browser = await launchChromium();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(pathToFileURL(mockupPath).href, { waitUntil: "networkidle" });

const names = await page.$$eval("[data-screen]", (els) =>
  els.map((el) => el.getAttribute("data-screen"))
);


if (names.length === 0) {
  console.error(
    "No [data-screen] containers found in the mockup. Add data-screen attributes to each top-level screen and re-run."
  );
  await browser.close();
  process.exit(1);
}

let n = 0;
for (const name of names) {
  n += 1;
  // Show only the target screen; mockups typically render one view at a time.
  await page.evaluate((target) => {
    document.querySelectorAll("[data-screen]").forEach((el) => {
      el.style.display = el.getAttribute("data-screen") === target ? "" : "none";
    });
    const el = document.querySelector(`[data-screen="${target}"]`);
    if (el && getComputedStyle(el).display === "none") el.style.display = "block";
    window.scrollTo(0, 0);
  }, name);
  await page.waitForTimeout(200); // let transitions settle

  const file = `${outDir}/screen-${String(n).padStart(2, "0")}-${name}.png`;
  const el = await page.$(`[data-screen="${name}"]`);
  try {
    await el.screenshot({ path: file });
  } catch {
    // Element not independently renderable (e.g. zero height) — capture viewport.
    await page.screenshot({ path: file });
  }
  console.log(`✓ ${file}`);
}

await browser.close();
console.log(`\nDone: ${n} screenshot(s) in ${outDir}. Filenames match storyboard.md references.`);
