// Testa as regras puras copiadas do projeto (mesma lógica do código-fonte).
const assert = require("node:assert/strict");
const isEmail = v => {
  const at = v.indexOf("@");
  return at > 0 && v.indexOf("@", at + 1) === -1 && v.indexOf(".", at) > at + 1 && v.lastIndexOf(".") < v.length - 2 && v.indexOf(" ") === -1;
};
const foldText = text => String(text).toLowerCase().normalize("NFD").split("").filter(ch => {
  const code = ch.charCodeAt(0); return code < 768 || code > 879;
}).join("");
const csvCell = value => {
  let text = String(value);
  if (text && "=+-@".indexOf(text.charAt(0)) !== -1) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
};
const clampQty = v => Math.min(10, Math.max(1, Math.floor(Number(v)) || 1));
const stockOf = (p, size) => (p.stock === null ? Infinity : p.stock[size]);
const hasStock = p => p.stock === null || Object.values(p.stock).some(q => q > 0);

// E-mail
for (const ok of ["ana@ex.com", "a@b.co", "chosenstyles.loja@gmail.com"]) assert.equal(isEmail(ok), true, ok);
for (const bad of ["ab", "x@y", "ana @ex.com", "a@@b.com", "@ex.com", "a@b."]) assert.equal(isEmail(bad), false, bad);

// Busca sem acento e sem maiúscula
assert.equal(foldText("Fé Inabalável"), "fe inabalavel");
assert.ok(foldText("Fé Inabalável").indexOf(foldText("fe")) !== -1);

// CSV: escapa aspas e neutraliza fórmulas
assert.equal(csvCell('ola "mundo"'), '"ola ""mundo"""');
assert.equal(csvCell("=HYPERLINK(1)"), '"\'=HYPERLINK(1)"');
assert.equal(csvCell("+55"), '"\'+55"');

// Quantidade sempre entre 1 e 10, mesmo com dado adulterado
assert.equal(clampQty("3"), 3);
assert.equal(clampQty(0), 1);
assert.equal(clampQty(-5), 1);
assert.equal(clampQty(999), 10);
assert.equal(clampQty("abc"), 1);

// Estoque não informado não limita; estoque zero bloqueia
const unlimited = { stock: null };
const zero = { stock: { P: 0, M: 0, G: 0, GG: 0 } };
assert.equal(stockOf(unlimited, "M") === Infinity, true);
assert.equal(stockOf(zero, "M") === 0, true);
assert.equal(hasStock(unlimited), true);
assert.equal(hasStock(zero), false);

// Total: promoção tem prioridade e valores somam corretamente
const unitPrice = p => p.promo ?? p.price;
const cart = [{ p: { price: 140, promo: null }, qty: 2 }, { p: { price: 200, promo: 150 }, qty: 1 }];
assert.equal(cart.reduce((t, l) => t + unitPrice(l.p) * l.qty, 0), 430);
console.log("todos os testes de regras passaram");
