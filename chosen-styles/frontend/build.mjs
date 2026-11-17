// Gera dist/index.html: um único arquivo com CSS, JavaScript e imagens embutidos.
// Sem dependências: rode com `node build.mjs`.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = (...parts) => join(here, "src", ...parts);
const read = (path) => readFileSync(path, "utf8");
const sorted = (dir) => readdirSync(src(dir)).filter((f) => !f.startsWith(".")).sort();

const template = read(join(here, "index.html"));

const css = sorted("styles").map((f) => read(src("styles", f))).join("\n");
const markup = sorted("markup").map((f) => read(src("markup", f))).join("\n");

const assetFiles = sorted("assets").filter((f) => f.endsWith(".webp"));
const assets = Object.fromEntries(
  assetFiles.map((f) => [f, "data:image/webp;base64," + readFileSync(src("assets", f)).toString("base64")])
);
// A foto do hero é embutida direto na marcação; o restante fica disponível ao JavaScript.
const markupOnlyAssets = new Set(["hero.webp", "manifesto.webp", "abertura.webp"]);
const scriptAssets = Object.fromEntries(Object.entries(assets).filter(([name]) => !markupOnlyAssets.has(name)));
const assetsScript = "const ASSETS = " + JSON.stringify(scriptAssets) + ";";

const vendor = read(src("vendor", "product-grid.js"));
const app = sorted("scripts").map((f) => read(src("scripts", f))).join("\n");
const appWrapped = '(() => {\n"use strict";\n' + app + "\n})();";

const withAssets = (text) =>
  text.replace(/\{\{asset:([^}]+)\}\}/g, (_, name) => {
    if (!(name in assets)) throw new Error("Ativo não encontrado: " + name);
    return assets[name];
  });

const scripts = [
  "<script>\n" + assetsScript + "\n</script>",
  "<script>\n" + vendor + "\n</script>",
  "<script>\n" + appWrapped + "\n</script>",
].join("\n");

let html = template
  .replace("{{css}}", () => css)
  .replace("{{markup}}", () => withAssets(markup))
  .replace("{{scripts}}", () => scripts);

// Política de segurança com hashes: só os scripts e estilos inline deste build são permitidos.
// Scripts sem 'unsafe-inline' impedem a execução de código injetado; os atributos style= continuam
// permitidos porque as animações definem variáveis CSS por elemento.
const { createHash } = await import("node:crypto");
const hashOf = (body) => "'sha256-" + createHash("sha256").update(body, "utf8").digest("base64") + "'";
// O hash é calculado sobre o texto exato entre as tags (com as quebras de linha que existirem)
const inlineScriptHashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => hashOf(m[1]));
const inlineStyleHashes = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => hashOf(m[1]));
const cspPolicy = [
  "default-src 'self'",
  "script-src 'self' " + inlineScriptHashes.join(" "),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src-elem 'self' " + inlineStyleHashes.join(" ") + " https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com data:",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "media-src 'none'",
  "form-action 'none'",
].join("; ");
html = html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, () => '<meta http-equiv="Content-Security-Policy" content="' + cspPolicy + '">');
console.log("CSP: " + inlineScriptHashes.length + " scripts e " + inlineStyleHashes.length + " estilo com hash");

mkdirSync(join(here, "dist"), { recursive: true });
writeFileSync(join(here, "dist", "index.html"), html, "utf8");
console.log("dist/index.html gerado:", (html.length / 1024).toFixed(0), "KB");
