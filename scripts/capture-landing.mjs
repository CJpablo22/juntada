import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
await page.goto('http://127.0.0.1:3456/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/juntada-landing.png', fullPage: true });
await browser.close();
console.log('landing ok');
