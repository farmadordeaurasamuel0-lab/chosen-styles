/* Testes da área de contato do rodapé.
 * Uso: SITE_FILE=dist/index.html node tests/e2e/contato.mjs
 * Confere o Instagram ativo, o WhatsApp ainda desativado (sem número) e o e-mail.
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

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    try { sessionStorage.setItem("cs:intro-seen", "1"); } catch { /* sem armazenamento */ }
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("file://" + siteFile, { waitUntil: "load" });
  await page.waitForSelector("#ig-link", { state: "attached" });
  await page.waitForTimeout(500);

  const ig = await page.evaluate(() => {
    const a = document.getElementById("ig-link");
    return { href: a.getAttribute("href"), disabled: a.hasAttribute("aria-disabled"), target: a.getAttribute("target"), rel: a.getAttribute("rel") || "", tabindex: a.getAttribute("tabindex") };
  });
  check("Instagram aponta para @vitorsamuel_bjj", ig.href === "https://instagram.com/vitorsamuel_bjj", ig.href);
  check("Instagram está ativo (sem aria-disabled e no teclado)", !ig.disabled && ig.tabindex === null);
  check("Instagram abre em nova aba com noopener", ig.target === "_blank" && ig.rel.includes("noopener"), `target=${ig.target} rel=${ig.rel}`);

  const wa = await page.evaluate(() => document.getElementById("wa-link").hasAttribute("aria-disabled"));
  check("WhatsApp continua desativado, pois a loja ainda não tem o número", wa === true);

  const mail = await page.evaluate(() => document.getElementById("mail-link").getAttribute("href"));
  check("e-mail da loja continua no rodapé", mail === "mailto:chosenstyles.loja@gmail.com", mail);

  check("nenhum erro de página", errors.length === 0, errors.join(" | "));
  await context.close();
} finally {
  await browser.close();
}
console.log(failures.length ? `\n${failures.length} verificação(ões) falharam.` : "\nTodas as verificações de contato passaram.");
process.exit(failures.length ? 1 : 0);
