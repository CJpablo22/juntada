import { chromium } from "playwright";
import fs from "fs";

const ART = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(ART, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
page.setDefaultTimeout(25000);

async function shot(name) {
  const p = `${ART}/${name}.png`;
  await page.screenshot({ path: p, fullPage: true });
  console.log("SHOT", p);
}

async function dump(label) {
  console.log(`\n=== ${label} ===`, page.url());
  console.log((await page.locator("body").innerText()).slice(0, 1600));
}

try {
  await page.goto("http://127.0.0.1:3456/enter", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Lucía/i }).click();
  await page.waitForURL(/\/app/);
  await page.waitForTimeout(700);

  await page.getByRole("button", { name: /El finde/i }).click();
  await page.waitForTimeout(1000);
  await dump("group");
  await shot("20-group");

  // Click Pronto tab
  await page.getByRole("button", { name: /2 · Pronto|Pronto/i }).first().click();
  await page.waitForTimeout(500);

  // Idea cards are buttons with onClick
  const ideaBtn = page.locator("button").filter({ hasText: /.+/ });
  // Find an idea title-looking button in the list - click first idea card area
  // From UI, ideas are often clickable panels. Try text of known seed ideas.
  const candidates = [
    /Past Lives/i,
    /Cena/i,
    /peli/i,
    /comer/i,
    /visitar/i,
    /cumple/i,
    /series/i,
  ];
  let opened = false;
  for (const re of candidates) {
    const el = page.getByText(re).first();
    if (await el.count()) {
      console.log("clicking idea text", re);
      await el.click();
      await page.waitForTimeout(900);
      if (page.url().includes("/idea/")) {
        opened = true;
        break;
      }
    }
  }
  if (!opened) {
    // dump all buttons briefly
    const all = page.locator("main button, main [role='button']");
    const n = await all.count();
    for (let i = 0; i < Math.min(n, 30); i++) {
      const t = (await all.nth(i).innerText()).trim().replace(/\s+/g, " ");
      if (t.length > 2 && t.length < 80) console.log("mbtn", t);
    }
  }

  if (!page.url().includes("/idea/")) {
    // Create food idea
    await page.getByRole("button", { name: /^Proponer idea$/i }).first().click();
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /^Comer$/i }).click();
    await page.waitForTimeout(400);
    await page.getByLabel(/^Título$/i).fill("Salir a comer");
    // After Comer, place fields appear
    const labels = await page.locator("label").allInnerTexts();
    console.log("labels", labels);
    const nameInput = page.locator("#place-name-0, input").filter({ has: page.locator("xpath=..") });
    // Try common ids from PlaceFields
    for (const id of ["place-name-0", "place-0-name", "idea-place-name"]) {
      const inp = page.locator(`#${id}`);
      if (await inp.count()) {
        await inp.fill("Bar El Rincón");
        break;
      }
    }
    // fallback: first text input after title in dialog that's empty
    const dialogInputs = page.locator('[role="dialog"] input.field-input, [role="dialog"] input');
    const dic = await dialogInputs.count();
    console.log("dialog inputs", dic);
    for (let i = 0; i < dic; i++) {
      const id = await dialogInputs.nth(i).getAttribute("id");
      const ph = await dialogInputs.nth(i).getAttribute("placeholder");
      const val = await dialogInputs.nth(i).inputValue();
      console.log(`  in[${i}] id=${id} ph=${ph} val=${val}`);
    }
    // Fill place-ish fields by placeholder
    const byPh = async (re, val) => {
      const el = page.locator(`[role="dialog"] input[placeholder]`).filter({ hasAttribute: "placeholder" });
      const c = await page.locator("[role=dialog] input").count();
      for (let i = 0; i < c; i++) {
        const inp = page.locator("[role=dialog] input").nth(i);
        const ph = (await inp.getAttribute("placeholder")) || "";
        const type = (await inp.getAttribute("type")) || "text";
        if (re.test(ph) || (re.source.includes("date") && type === "date")) {
          await inp.fill(val);
          return true;
        }
      }
      return false;
    };
    // Fill second text-ish after title
    // Title already filled. Find place name label sibling
    const placeLabel = page.locator("label").filter({ hasText: /nombre|lugar|sitio|dirección/i });
    const plc = await placeLabel.count();
    for (let i = 0; i < plc; i++) {
      const forId = await placeLabel.nth(i).getAttribute("for");
      console.log("place label", await placeLabel.nth(i).innerText(), forId);
      if (forId) {
        const v = (await placeLabel.nth(i).innerText()).match(/direc/i)
          ? "Calle Mayor 12"
          : "Bar El Rincón";
        await page.locator(`#${forId}`).fill(v);
      }
    }
    const date = page.locator('[role="dialog"] input[type="date"]').first();
    if (await date.count()) await date.fill("2026-10-25");
    const time = page.locator('[role="dialog"] input[type="time"]').first();
    if (await time.count()) await time.fill("21:00");
    await shot("21-create");
    await page.getByRole("button", { name: /Guardar|Proponer|Crear|Añadir|Sumar/i }).last().click();
    await page.waitForTimeout(1500);
    await dump("created");
    // open idea
    const ideaText = page.getByText("Salir a comer").first();
    if (await ideaText.count()) {
      await ideaText.click();
      await page.waitForTimeout(900);
    }
  }

  await dump("idea");
  await shot("22-idea");

  const where = page.getByText("Dónde y cuándo").first();
  if (!(await where.count())) {
    console.log("MISSING plan options section");
    process.exitCode = 1;
  } else {
    await where.scrollIntoViewIfNeeded();
    await shot("23-options-section");

    const propose = page.getByRole("button", { name: /Proponer otra/i });
    if (await propose.count()) {
      await propose.click();
      await page.locator("#opt-place").fill("La Pepita");
      await page.locator("#opt-address").fill("Malasaña");
      await page.locator("#opt-date").fill("2026-10-26");
      await page.locator("#opt-time").fill("20:30");
      await shot("24-form");
      await page.getByRole("button", { name: /Publicar opción/i }).click();
      await page.waitForTimeout(900);
    }

    const meGusta = page.getByRole("button", { name: /^Me gusta$/i }).first();
    if (await meGusta.count()) {
      await meGusta.click();
      await page.waitForTimeout(500);
    }
    await shot("25-voted");
    await dump("final");
    const body = await page.locator("body").innerText();
    console.log(
      "CHECKS",
      JSON.stringify({
        section: body.includes("Dónde y cuándo"),
        vote: /Me gusta|Te gusta/.test(body),
        pepita: body.includes("La Pepita") || body.includes("opción") || body.includes("Opción"),
        extras: body.includes("Extras del plan"),
      }),
    );
    console.log("DONE OK");
  }
} catch (e) {
  console.error("FAIL", e);
  await shot("fail3");
  process.exitCode = 1;
} finally {
  await browser.close();
}
