/* Testes do seletor de quantidade (página do produto).
 * Uso: SITE_FILE=dist/index.html node tests/e2e/quantidade.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteFile = path.resolve(process.env.SITE_FILE || path.join(here, "../../dist/index.html"));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "OK    " : "FALHA "} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures.push(name);
};

const shownDigit = (page) => page.$eval("#pv-qty-value .qty-digit:not(.is-leaving)", (el) => el.textContent);
const digitCount = (page) => page.$$eval("#pv-qty-value .qty-digit", (els) => els.length);
const isOff = (page, dir) => page.$eval(`[data-qty-step="${dir}"]`, (el) => el.getAttribute("aria-disabled") === "true");
const hintText = (page) => page.$eval("#pv-qty-hint", (el) => el.textContent);
const cartLines = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("chosen-styles:cart") || "[]"));

async function openProduct(browser, { id, reducedMotion = "no-preference", viewport = { width: 390, height: 844 } }) {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.addInitScript(() => {
    try { sessionStorage.setItem("cs:intro-seen", "1"); } catch { /* sem armazenamento */ }
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("file://" + siteFile + "#produto-" + id, { waitUntil: "load" });
  await page.waitForSelector("#pv-qty", { state: "attached", timeout: 8000 });
  return { context, page, errors };
}

const browser = await chromium.launch();
try {
  {
    // Fluxo completo no celular (Essential Black: M com 18 em estoque, P com 1)
    const { context, page, errors } = await openProduct(browser, { id: "essential-black" });
    check("começa em 1, com − e + desativados antes de escolher o tamanho",
      (await shownDigit(page)) === "1" && (await isOff(page, -1)) && (await isOff(page, 1)));
    check("pede o tamanho antes de ajustar", (await hintText(page)).includes("Escolha um tamanho"));

    await page.click('[data-pv-size="M"]');
    check("com tamanho M, + ativo e − desativado em 1", !(await isOff(page, 1)) && (await isOff(page, -1)));

    for (let i = 0; i < 9; i++) await page.click('[data-qty-step="1"]');
    check("toques no + chegam a 10 (limite por tamanho)", (await shownDigit(page)) === "10", await shownDigit(page));
    check("+ desativado em 10, com aviso de limite", (await isOff(page, 1)) && (await hintText(page)).includes("Limite de 10"));
    await page.click('[data-qty-step="1"]', { force: true });
    check("tocar no + no limite não passa de 10", (await shownDigit(page)) === "10", await shownDigit(page));

    const minus = await page.locator('[data-qty-step="-1"]').boundingBox();
    await page.mouse.move(minus.x + minus.width / 2, minus.y + minus.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.mouse.up();
    await page.waitForTimeout(350);
    check("segurar − repete até 1", (await shownDigit(page)) === "1", await shownDigit(page));
    check("ao chegar em 1, − desativado", await isOff(page, -1));

    await page.click('[data-pv-size="P"]');
    check("tamanho P (1 unidade em estoque) limita o seletor a 1",
      (await shownDigit(page)) === "1" && (await isOff(page, 1)) && (await hintText(page)).includes("Restam 1 unidade"),
      await hintText(page));

    await page.click('[data-pv-size="M"]');
    await page.click('[data-qty-step="1"]');
    await page.click('[data-qty-step="1"]');
    check("dois toques no + deixam 3 unidades", (await shownDigit(page)) === "3", await shownDigit(page));
    await page.click("#pv-add");
    await page.waitForTimeout(1500);
    const line = (await cartLines(page)).find((l) => l.id === "essential-black" && l.size === "M");
    check("Adicionar à sacola leva as 3 unidades", line && line.qty === 3, JSON.stringify(line));
    check("depois de adicionar, o número continua 3", (await shownDigit(page)) === "3");

    await page.focus('[data-qty-step="1"]');
    await page.keyboard.press("Enter");
    await page.waitForTimeout(350);
    check("Enter no teclado aumenta uma unidade", (await shownDigit(page)) === "4", await shownDigit(page));
    check("sem números duplicados depois da animação", (await digitCount(page)) === 1, String(await digitCount(page)));

    await page.click("#pv-buy");
    await page.waitForTimeout(1500);
    const afterBuy = (await cartLines(page)).find((l) => l.id === "essential-black" && l.size === "M");
    check("Comprar agora soma as 4 unidades à linha (3 + 4 = 7)", afterBuy && afterBuy.qty === 7, JSON.stringify(afterBuy));

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("sem rolagem horizontal em 390 px", overflow <= 0, "excesso=" + overflow);
    check("nenhum erro de página", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  {
    // Limite pelo estoque: Off-White tamanho M tem 4 em estoque
    const { context, page, errors } = await openProduct(browser, { id: "essential-offwhite" });
    await page.click('[data-pv-size="M"]');
    for (let i = 0; i < 3; i++) await page.click('[data-qty-step="1"]');
    check("estoque de 4 limita o seletor a 4", (await shownDigit(page)) === "4" && (await isOff(page, 1)), await shownDigit(page));
    check("aviso informa as unidades que restam", (await hintText(page)).includes("Restam 4 unidades"), await hintText(page));
    await page.click("#pv-add");
    await page.waitForTimeout(1500);
    const line = (await cartLines(page)).find((l) => l.id === "essential-offwhite" && l.size === "M");
    check("adicionar as 4 unidades em estoque funciona", line && line.qty === 4, JSON.stringify(line));
    check("depois de levar tudo, o seletor fica sem unidades",
      (await isOff(page, 1)) && (await hintText(page)).includes("Sem unidades"), await hintText(page));
    check("nenhum erro de página", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  {
    // Movimento reduzido: o seletor continua funcionando, sem animação
    const { context, page, errors } = await openProduct(browser, { id: "essential-black", reducedMotion: "reduce" });
    await page.click('[data-pv-size="M"]');
    await page.click('[data-qty-step="1"]');
    check("com movimento reduzido, + ainda conta", (await shownDigit(page)) === "2");
    check("com movimento reduzido, não sobra número antigo", (await digitCount(page)) === 1);
    check("nenhum erro de página", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  {
    // Sem tamanho escolhido, o seletor não muda nada
    const { context, page, errors } = await openProduct(browser, { id: "essential-black" });
    await page.click('[data-qty-step="1"]', { force: true });
    check("sem tamanho, o + não muda o número", (await shownDigit(page)) === "1");
    check("nenhum erro de página", errors.length === 0, errors.join(" | "));
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(failures.length ? `\n${failures.length} verificação(ões) falharam.` : "\nTodas as verificações do seletor passaram.");
process.exit(failures.length ? 1 : 0);
