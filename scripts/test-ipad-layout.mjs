import { chromium } from "playwright";
import fs from "fs";

const ART = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(ART, { recursive: true });

// iPad portrait CSS pixels
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 768, height: 1024 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

await page.goto("http://127.0.0.1:3456/enter", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Lucía/i }).click();
await page.waitForURL(/\/app/);
await page.waitForTimeout(600);
await page.getByRole("button", { name: /El finde/i }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${ART}/ipad-group-top.png`, fullPage: false });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.screenshot({ path: `${ART}/ipad-group-bottom.png`, fullPage: false });
await page.screenshot({ path: `${ART}/ipad-group-full.png`, fullPage: true });
console.log("done");
await browser.close();
