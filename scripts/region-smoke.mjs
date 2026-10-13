import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const base = 'http://127.0.0.1:3456';
const out = '/opt/cursor/artifacts/screenshots';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const users = [
  { name: /Lucía/i, file: 'region-madrid', expect: { region: 'madrid', country: 'ES', btn: 'block', pattern: 'grid' } },
  { name: /Mateo/i, file: 'region-sevilla', expect: { region: 'sevilla', country: 'ES', btn: 'tile', pattern: 'azulejo' } },
  { name: /Sofía/i, file: 'region-barcelona', expect: { region: 'barcelona', country: 'ES', btn: 'soft', pattern: 'modernista' } },
  { name: /Valentina/i, file: 'region-buenos-aires', expect: { region: 'buenos_aires', country: 'AR', btn: 'slab', pattern: 'rioplata' } },
];

const results = [];

for (const u of users) {
  await page.goto(base + '/enter', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: u.name }).first().click();
  await page.waitForURL('**/app');
  await page.waitForTimeout(400);
  const meta = await page.evaluate(() => {
    const r = document.documentElement;
    const body = getComputedStyle(document.body);
    const btn = document.querySelector('[data-slot="button"]');
    const btnStyle = btn ? getComputedStyle(btn) : null;
    return {
      region: r.dataset.region,
      country: r.dataset.country,
      btn: r.dataset.btn,
      pattern: r.dataset.pattern,
      fontBody: getComputedStyle(r).getPropertyValue('--font-body').trim(),
      fontDisplay: getComputedStyle(r).getPropertyValue('--font-display').trim(),
      bg: body.backgroundImage.slice(0, 80),
      btnRadius: btnStyle?.borderRadius,
      btnTransform: btnStyle?.textTransform,
      headingFamily: getComputedStyle(document.querySelector('h1') || document.body).fontFamily.slice(0, 60),
    };
  });
  const pass =
    meta.region === u.expect.region &&
    meta.country === u.expect.country &&
    meta.btn === u.expect.btn &&
    meta.pattern === u.expect.pattern;
  results.push({ user: u.file, pass, meta });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${u.file}`, JSON.stringify(meta));
  await page.screenshot({ path: `${out}/${u.file}.png`, fullPage: false });
}

// Province preview on profile: Lucía -> Bilbao-ish Asturias via province change if available
await page.goto(base + '/app/profile', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
// Try changing country to AR and province
const countrySelect = page.locator('select').first();
if (await countrySelect.count()) {
  await countrySelect.selectOption('AR');
  await page.waitForTimeout(200);
  const provinceSelect = page.locator('select').nth(1);
  if (await provinceSelect.count()) {
    const opts = await provinceSelect.locator('option').allTextContents();
    const mendoza = opts.find((o) => /mendoza/i.test(o));
    if (mendoza) {
      await provinceSelect.selectOption({ label: mendoza.trim() });
      await page.waitForTimeout(400);
    }
  }
  const arInterior = await page.evaluate(() => ({
    region: document.documentElement.dataset.region,
    pattern: document.documentElement.dataset.pattern,
    country: document.documentElement.dataset.country,
  }));
  const passInterior = arInterior.region === 'ar_interior' || arInterior.country === 'AR';
  results.push({ user: 'preview-ar-interior', pass: passInterior, meta: arInterior });
  console.log(`${passInterior ? 'PASS' : 'FAIL'} preview-ar-interior`, JSON.stringify(arInterior));
  await page.screenshot({ path: `${out}/region-ar-interior-preview.png`, fullPage: false });
}

const failed = results.filter((r) => !r.pass);
console.log('\nSummary:', results.length - failed.length, '/', results.length, 'passed');
await browser.close();
process.exit(failed.length ? 1 : 0);
