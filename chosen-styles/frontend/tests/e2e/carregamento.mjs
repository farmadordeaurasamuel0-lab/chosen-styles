/* Testes de carregamento: a tela inicial precisa sair do caminho em qualquer data (inclusive depois do
 * lançamento), com o armazenamento do navegador bloqueado, e mesmo se um erro interromper o script.
 * Uso:  SITE_FILE=dist/index.html node tests/e2e/carregamento.mjs
 */
import fs from "node:fs";
import os from "node:os";
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

// Simula a janela de visualização que bloqueia o armazenamento: qualquer acesso gera SecurityError.
const blockStorage = (context) => context.addInitScript(() => {
  for (const name of ["localStorage", "sessionStorage"]) {
    Object.defineProperty(window, name, {
      configurable: true,
      get() { throw new DOMException("Access is denied for this document.", "SecurityError"); },
    });
  }
});

async function openSite(browser, { date, blocked = false, file = siteFile }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  if (blocked) await blockStorage(context);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (date) await page.clock.setFixedTime(new Date(date));
  await page.goto("file://" + file, { waitUntil: "load" });
  return { context, page, errors };
}

async function waitGone(page, selector, timeout) {
  try {
    await page.waitForFunction((sel) => !document.querySelector(sel), selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

const browser = await chromium.launch();
try {
  for (const blocked of [false, true]) {
    const label = blocked ? "armazenamento bloqueado" : "armazenamento normal";
    const { context, page, errors } = await openSite(browser, { date: "2026-11-10T12:00:00-03:00", blocked });
    const loaderOk = await waitGone(page, "#loader", 3000);
    const introOk = await waitGone(page, "#intro", 7500);
    const pending = await page.evaluate(() => document.documentElement.classList.contains("intro-pending"));
    const countdown = await page.evaluate(() => document.getElementById("cd-d")?.textContent);
    check(`depois do lançamento, ${label}: carregamento sai`, loaderOk);
    check(`depois do lançamento, ${label}: abertura termina sozinha (antes de 7,5 s)`, introOk);
    check(`depois do lançamento, ${label}: tela inicial liberada`, !pending);
    check(`depois do lançamento, ${label}: cronômetro zerado sem erro`, countdown === "00", `dias=${countdown}`);
    check(`depois do lançamento, ${label}: nenhum erro de página`, errors.length === 0, errors.join(" | "));
    await context.close();
  }

  {
    const { context, page, errors } = await openSite(browser, { date: "2026-11-09T12:00:00-03:00" });
    const introOk = await waitGone(page, "#intro", 7500);
    check("antes do lançamento: abertura termina e nenhum erro", introOk && errors.length === 0, errors.join(" | "));
    await context.close();
  }

  {
    const { context, page, errors } = await openSite(browser, { date: "2026-11-10T12:00:00-03:00", blocked: true });
    await page.waitForTimeout(800);
    await page.click("#intro-skip");
    const skipped = await waitGone(page, "#intro", 4000);
    check("pular a abertura com armazenamento bloqueado", skipped && errors.length === 0, errors.join(" | "));
    await context.close();
  }

  {
    const { context, page } = await openSite(browser, { date: "2026-11-10T12:00:00-03:00" });
    await waitGone(page, "#intro", 7500);
    await page.reload({ waitUntil: "load" });
    const again = await waitGone(page, "#intro", 1500);
    check("a abertura não se repete na mesma sessão", again);
    await context.close();
  }

  {
    // Erro inesperado no meio do script: a rede de segurança precisa liberar a tela sozinha.
    const original = fs.readFileSync(siteFile, "utf8");
    const withoutCsp = original.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, "");
    const marker = "const hideLoader = () => {";
    const parts = withoutCsp.split(marker);
    if (parts.length !== 2) throw new Error("trecho de teste não encontrado no HTML gerado");
    const tmp = path.join(os.tmpdir(), `chosen-falha-${process.pid}.html`);
    fs.writeFileSync(tmp, parts[0] + 'throw new Error("falha simulada para o teste");\n' + marker + parts[1]);
    const { context, page, errors } = await openSite(browser, { date: "2026-11-10T12:00:00-03:00", file: tmp });
    const introOk = await waitGone(page, "#intro", 9500);
    const loaderOk = await waitGone(page, "#loader", 9500);
    check("erro no meio do script: a rede de segurança remove a abertura", introOk);
    check("erro no meio do script: a rede de segurança remove a tela de carregamento", loaderOk);
    check("erro no meio do script: o único erro é o simulado", errors.length === 1 && errors[0].includes("falha simulada"), errors.join(" | "));
    await context.close();
    fs.rmSync(tmp, { force: true });
  }
} finally {
  await browser.close();
}
console.log(failures.length ? `\n${failures.length} verificação(ões) falharam.` : "\nTodas as verificações de carregamento passaram.");
process.exit(failures.length ? 1 : 0);
