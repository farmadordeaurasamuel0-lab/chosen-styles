/* Testes ponta a ponta do Chosen Styles (navegador real, via Playwright).
 * Uso:  npx playwright install chromium  (uma vez)
 *       SITE_FILE=dist/index.html node tests/e2e/run.mjs
 * Se o Playwright não estiver instalado no projeto, indique o módulo com PLAYWRIGHT_MODULE.
 * Cada verificação imprime OK ou FALHA. O processo termina com código 1 se alguma falhar.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteFile = path.resolve(process.env.SITE_FILE || path.join(here, "../../dist/index.html"));
const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(playwrightModule);

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });
const pageUrl = hash => "file://" + siteFile + (hash || "");
const sleep = (page, ms) => page.waitForTimeout(ms);
const isFileErr = t => /ERR_NAME_NOT_RESOLVED|Failed to load resource/.test(t); // fontes externas sem rede

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 390, height: 844 }, reducedMotion: opts.reducedMotion || "no-preference" });
  await ctx.addInitScript(() => sessionStorage.setItem("cs:intro-seen", "1"));
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !isFileErr(m.text())) errors.push(m.text()); });
  return { ctx, page, errors };
}

const browser = await chromium.launch({ headless: true });

// 1. Largura: nenhuma rolagem horizontal
for (const w of [360, 390, 768, 1280, 1920]) {
  const { ctx, page, errors } = await newPage(browser, { viewport: { width: w, height: 800 } });
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 500);
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  check(`sem rolagem horizontal em ${w}px`, docW <= w, `página ${docW}px`);
  await ctx.close();
}

// 2. Navegação do cabeçalho: visível a partir de 600px
for (const [w, expect] of [[390, false], [600, true], [1280, true]]) {
  const { ctx, page } = await newPage(browser, { viewport: { width: w, height: 800 } });
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 400);
  const vis = await page.evaluate(() => getComputedStyle(document.querySelector(".nav")).display !== "none");
  check(`links do cabeçalho ${expect ? "visíveis" : "ocultos"} em ${w}px`, vis === expect);
  await ctx.close();
}

// 3. Compra: cadastro, pagamento, resumo e bloqueio sem WhatsApp configurado
{
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(pageUrl("#produto-essential-black"), { waitUntil: "load" }); await sleep(page, 700);
  check("página do produto abre pelo endereço", (await page.textContent("#pv-title")).length > 0);
  check("botão de curtir aparece na página do produto", (await page.locator("#pv-info .like-btn").count()) === 1);
  await page.locator("#pv-info [data-pv-size]").nth(0).click({ force: true });
  await page.locator("#pv-add").click({ force: true }); await sleep(page, 2200);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await sleep(page, 900);
  await page.locator("#cart-btn").click({ force: true }); await sleep(page, 700);
  check("a sacola abre com a peça", (await page.locator("#cart-items li").count()) === 1);
  await page.locator("#review-btn").click(); await sleep(page, 250);
  const dataErr = (await page.textContent("#signup-error")).trim();
  check("cadastro vazio aponta os dados pessoais", dataErr.includes("nome") && dataErr.includes("e-mail"), dataErr.slice(0, 60));
  await page.locator("#signup-form input[name=fullname]").fill("Maria Silva");
  await page.locator("#signup-form input[name=email]").fill("maria@exemplo.com");
  await page.locator("#signup-form input[name=cep]").fill("74000000");
  await page.locator("#review-btn").click(); await sleep(page, 250);
  check("sem forma de pagamento, o resumo não abre", !(await page.locator("#review").isVisible()));
  await page.locator("input[name=pay][value=pix]").check({ force: true });
  await page.locator("#review-btn").click(); await sleep(page, 250);
  check("com dados e pagamento, o resumo abre", await page.locator("#review").isVisible());
  check("finalizar fica bloqueado sem WhatsApp configurado",
    (await page.locator("#confirm-btn").isDisabled()) && (await page.textContent("#confirm-btn")).trim() === "Atendimento em configuração");
  await page.locator("input[name=pay][value=credito]").check({ force: true }); await sleep(page, 200);
  check("trocar o pagamento depois de revisar atualiza o resumo", (await page.textContent("#review-pay")).includes("crédito"));
  check("compra sem erros de página", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// 4. Sacola: estoque, remoção e total
{
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(pageUrl("#produto-essential-black"), { waitUntil: "load" }); await sleep(page, 700);
  await page.locator("#pv-info [data-pv-size]").nth(0).click({ force: true });
  await page.locator("#pv-add").click({ force: true }); await sleep(page, 2200);
  await page.locator("#pv-add").click({ force: true }).catch(() => {}); await sleep(page, 2200);
  check("estoque de 1 unidade impede a segunda", (await page.textContent("#pv-error")).includes("Não há mais unidades"));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await sleep(page, 900);
  await page.locator("#cart-btn").click({ force: true }); await sleep(page, 600);
  await page.locator("#cart-items button:has-text('Remover')").first().click({ force: true }); await sleep(page, 500);
  const total = (await page.textContent("#cart-total")).replace(/\u00a0/g, " ").trim();
  check("remover a última peça zera o total", total === "R$ 0,00", total);
  check("sacola sem erros de página", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// 5. Diálogo da sacola: foco entra, não sai com Tab, Escape fecha e devolve o foco
{
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 600);
  await page.locator("#cart-btn").click({ force: true }); await sleep(page, 600);
  const inside = () => page.evaluate(() => document.getElementById("drawer").contains(document.activeElement));
  check("sacola: o foco entra no diálogo ao abrir", await inside());
  let exits = 0;
  for (let i = 0; i < 25; i++) { await page.keyboard.press("Tab"); if (!(await inside())) exits++; }
  check("sacola: o Tab não sai do diálogo (25 toques)", exits === 0, "saídas=" + exits);
  await page.keyboard.press("Escape"); await sleep(page, 500);
  check("sacola: Escape fecha e devolve o foco ao botão", await page.evaluate(() => document.activeElement && document.activeElement.id === "cart-btn"));
  check("diálogos sem erros de página", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// 6. Teclado: indicador de foco visível em todos os elementos alcançados
{
  const { ctx, page } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 500);
  let semFoco = 0, total = 0;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
    });
    if (r === null) continue;
    total++; if (!r) semFoco++;
  }
  check("teclado: todo elemento focado tem indicador visível", semFoco === 0 && total > 10, `${total} elementos, ${semFoco} sem indicador`);
  await ctx.close();
}

// 7. Movimento: nenhuma animação com a preferência de movimento reduzido
for (const [mode, expectNone] of [["reduce", true], ["no-preference", false]]) {
  const { ctx, page } = await newPage(browser, { reducedMotion: mode });
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 2000);
  const running = await page.evaluate(() => document.getAnimations().filter(a => a.playState === "running").length);
  check(`animações com movimento ${mode === "reduce" ? "reduzido: nenhuma" : "normal: ativas"}`, expectNone ? running === 0 : running > 0, "em execução=" + running);
  await ctx.close();
}

// 8. Abertura: aparece na primeira visita, termina e a tela inicial fica visível
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 1200);
  const started = await page.evaluate(() => !!document.getElementById("intro"));
  await sleep(page, 5800);
  const done = await page.evaluate(() => ({ intro: !!document.getElementById("intro"), titleOpacity: getComputedStyle(document.querySelector(".hero-title")).opacity }));
  check("primeira visita: a abertura aparece", started);
  check("primeira visita: a abertura termina e a tela inicial fica visível", !done.intro && done.titleOpacity === "1");
  check("primeira visita sem erros de página", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// 9. Segurança: a política de conteúdo não bloqueia nada numa sessão normal
{
  const { ctx, page } = await newPage(browser);
  const violations = [];
  page.on("console", m => { if (/Content Security Policy|Refused to/.test(m.text())) violations.push(m.text().slice(0, 120)); });
  await page.goto(pageUrl("#produto-essential-black"), { waitUntil: "load" }); await sleep(page, 1200);
  await page.locator("#cart-btn").click({ force: true }); await sleep(page, 500);
  check("política de conteúdo sem bloqueios", violations.length === 0, violations.slice(0, 1).join(""));
  check("política de conteúdo presente no HTML", (await page.content()).includes("script-src 'self' 'sha256-"));
  await ctx.close();
}

// 10. Acessibilidade estrutural
{
  const { ctx, page } = await newPage(browser);
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 500);
  const a = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    h1: document.querySelectorAll("h1").length,
    semRotulo: Array.from(document.querySelectorAll("input,select,textarea")).filter(el => !el.closest("[hidden]") && el.type !== "hidden" && !(el.id && document.querySelector('label[for="' + el.id + '"]')) && !el.closest("label") && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")).length,
    botaoSemNome: Array.from(document.querySelectorAll("button")).filter(b => !b.closest("[hidden]") && !(b.textContent.trim() || b.getAttribute("aria-label") || b.getAttribute("title"))).length,
    imgSemAlt: Array.from(document.images).filter(i => !i.hasAttribute("alt")).length,
    faixaOculta: document.querySelector(".soon-tape") ? document.querySelector(".soon-tape").getAttribute("aria-hidden") === "true" : true
  }));
  check("idioma da página é pt-BR", a.lang === "pt-BR");
  check("uma única página com título principal (h1)", a.h1 === 1, "h1=" + a.h1);
  check("campos de formulário têm rótulo", a.semRotulo === 0, "sem rótulo=" + a.semRotulo);
  check("botões têm nome acessível", a.botaoSemNome === 0, "sem nome=" + a.botaoSemNome);
  check("imagens têm texto alternativo", a.imgSemAlt === 0);
  check("faixa decorativa escondida da leitura de tela", a.faixaOculta);
  await ctx.close();
}

// 11. Legibilidade: nenhum texto visível abaixo de 12px (exceto a marca do logotipo)
{
  const { ctx, page } = await newPage(browser, { viewport: { width: 360, height: 780 } });
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 500);
  const pequenos = await page.evaluate(() => Array.from(document.querySelectorAll("body *")).filter(el => {
    if (el.closest("[hidden],.drawer:not(.is-open),.intro,.adm,.logo")) return false;
    const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) return false;
    const st = getComputedStyle(el);
    return st.display !== "none" && st.visibility !== "hidden" && parseFloat(st.fontSize) < 12;
  }).length);
  check("textos com pelo menos 12px no celular", pequenos === 0, "abaixo de 12px=" + pequenos);
  await ctx.close();
}

// 12. Contraste: textos com razão mínima de 4,5 (textos grandes: 3)
{
  const { ctx, page } = await newPage(browser);
  await page.goto(pageUrl(), { waitUntil: "load" }); await sleep(page, 700);
  const falhas = await page.evaluate(() => {
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(",").map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const bgOf = el => { let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.9) return c; e = e.parentElement; } return { r: 10, g: 10, b: 10, a: 1 }; };
    let n = 0;
    document.querySelectorAll("body *").forEach(el => {
      if (!Array.from(el.childNodes).some(x => x.nodeType === 3 && x.textContent.trim())) return;
      if (el.closest("[hidden],.drawer:not(.is-open),.intro,.adm")) return;
      const st = getComputedStyle(el);
      if (st.visibility === "hidden" || st.display === "none" || parseFloat(st.opacity) < 0.5) return;
      if (parseFloat(st.webkitTextStrokeWidth || "0") > 0 && st.color.includes("0, 0, 0, 0")) return; // texto só com contorno (decorativo)
      const fg0 = parse(st.color); if (!fg0) return;
      const bg = bgOf(el);
      const fg = { r: fg0.r * fg0.a + bg.r * (1 - fg0.a), g: fg0.g * fg0.a + bg.g * (1 - fg0.a), b: fg0.b * fg0.a + bg.b * (1 - fg0.a) };
      const size = parseFloat(st.fontSize), weight = parseInt(st.fontWeight, 10) || 400;
      const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
      if (ratio(fg, bg) < need) n++;
    });
    return n;
  });
  check("contraste dos textos dentro do mínimo WCAG", falhas === 0, "abaixo do mínimo=" + falhas);
  await ctx.close();
}

await browser.close();
let fails = 0;
for (const r of results) {
  if (!r.ok) fails++;
  console.log((r.ok ? "OK    " : "FALHA ") + r.name + (r.detail ? " — " + r.detail : ""));
}
console.log(`\n${results.length - fails} de ${results.length} verificações passaram.`);
process.exit(fails ? 1 : 0);
