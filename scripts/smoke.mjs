import { chromium } from 'playwright';

const base = 'http://127.0.0.1:3456';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const results = [];

function ok(name, pass, detail='') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}${detail ? ': ' + detail : ''}`);
}

try {
  await page.goto(base + '/enter', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Lucía/i }).first().click();
  await page.waitForURL('**/app');
  ok('login Lucia', page.url().includes('/app'));

  await page.getByRole('button', { name: /Nosotros dos/i }).click();
  await page.waitForURL('**/app/group/group_nos');
  ok('open group', page.url().includes('group_nos'));

  // Catalog shelf by default
  const catalogItem = await page.getByRole('button', { name: /Past Lives|Severance/i }).count();
  ok('catalog shelf', catalogItem > 0, `items=${catalogItem}`);

  await page.getByRole('button', { name: /^Pronto$/i }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /Ramen Shifu/i }).click();
  await page.waitForURL('**/idea/idea_ramen');
  ok('open soon idea', page.url().includes('idea_ramen'));

  await page.getByRole('group', { name: 'Puntuación' }).getByRole('button', { name: '4' }).first().click();
  await page.waitForTimeout(300);
  const scored = await page.locator('text=4/5').count();
  ok('cast secret vote', scored > 0, `scored=${scored}`);

  await page.getByRole('button', { name: /Revelar votos/i }).click();
  await page.waitForTimeout(200);
  const revealed = await page.locator('text=Resultados').count();
  ok('reveal votes', revealed > 0);

  await page.getByRole('link', { name: /Nosotros dos/i }).click();
  await page.waitForURL('**/app/group/group_nos');
  await page.getByRole('button', { name: /^Pronto$/i }).click();
  await page.getByRole('button', { name: /Que decida el azar/i }).click();
  await page.waitForTimeout(1200);
  const chosen = await page.locator('text=Elegida').count();
  ok('lottery', chosen > 0, `chosen badges=${chosen}`);

  await page.getByRole('button', { name: /Gastos/i }).click();
  await page.waitForURL('**/expenses');
  await page.locator('#title').fill('Prueba cafe');
  await page.locator('#amount').fill('12');
  await page.getByRole('button', { name: /Guardar gasto/i }).click();
  await page.waitForTimeout(300);
  const hist = await page.locator('text=Prueba cafe').count();
  ok('add expense', hist > 0);

  await page.getByRole('link', { name: /Mateo|Lucía/i }).first().click().catch(()=>{});
  // profile via header name
  await page.goto(base + '/app/profile', { waitUntil: 'networkidle' });
  const pts = await page.locator('text=/puntos/i').count();
  ok('profile', pts > 0);

  await page.goto(base + '/discover', { waitUntil: 'networkidle' });
  const discover = await page.locator('text=The Bear').count();
  ok('discover public', discover > 0);

  await page.goto(base + '/app/friends', { waitUntil: 'networkidle' });
  const friends = await page.locator('text=Mateo').count();
  ok('experience friends', friends > 0);

  await page.goto(base + '/app/profile', { waitUntil: 'networkidle' });
  await page.locator('#province').selectOption('Sevilla');
  await page.waitForTimeout(150);
  await page.locator('#city').selectOption('Sevilla');
  await page.locator('#neighborhood').selectOption('Triana');
  // Per-group privacy control
  const groupVis = await page.locator('#vis-group_nos').count();
  ok('group privacy control', groupVis > 0);
  if (groupVis > 0) {
    await page.locator('#vis-group_nos').selectOption('exact');
    await page.locator('#vis-group_finde').selectOption('country');
  }
  await page.getByRole('button', { name: /^Guardar$/i }).click();
  await page.waitForTimeout(500);
  const sevillaLook = await page.locator('text=/Look Sevilla|Sevilla/i').count();
  ok('regional theme sevilla', sevillaLook > 0);
  const barrioSelect = await page.locator('#neighborhood option').count();
  ok('neighborhood options', barrioSelect > 3, `opts=${barrioSelect}`);

  await page.screenshot({ path: '/tmp/computer-use/playwright-profile.png', fullPage: true });
  await page.goto(base + '/app/group/group_nos', { waitUntil: 'networkidle' });
  const exactShown = await page.locator('text=/Espíritu Santo|Pureza/i').count();
  ok('group shows exact address when allowed', exactShown > 0, `hits=${exactShown}`);
  await page.goto(base + '/app/group/group_finde', { waitUntil: 'networkidle' });
  const countryOnly = await page.locator('text=/Solo país|España/i').count();
  const noStreet = await page.locator('text=/Espíritu Santo/i').count();
  ok('other group hides street', countryOnly > 0 && noStreet === 0, `country=${countryOnly} street=${noStreet}`);
  await page.screenshot({ path: '/tmp/computer-use/playwright-group.png', fullPage: true });
} catch (e) {
  ok('exception', false, String(e));
  await page.screenshot({ path: '/tmp/computer-use/playwright-error.png', fullPage: true });
} finally {
  const failed = results.filter(r => !r.pass);
  console.log(JSON.stringify({ failed: failed.length, results }, null, 2));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
}
