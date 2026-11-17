/* ===== Carrinho (persistido com proteção) ===== */
const CART_KEY = "chosen-styles:cart";
let cart = [];
// Linhas podem trazer o número do pedido enviado (sent). Elas ficam visíveis, mas não contam no total.
const SENT_ID = /^PED-[A-Z0-9]{4,20}$/;
try {
  const saved = JSON.parse(safeStorage.local.get(CART_KEY) || "[]");
  const valid = Array.isArray(saved)
    ? saved.filter(l => l && typeof l.id === "string" && findProduct(l.id) && SIZES.includes(l.size))
    : [];
  cart = valid.map(l => {
    const wanted = Math.min(10, Math.max(1, Math.floor(Number(l.qty)) || 1));
    const line = { id: l.id, size: l.size, qty: wanted };
    if (typeof l.sent === "string" && SENT_ID.test(l.sent)) line.sent = l.sent;
    return line;
  });
  // Limites de estoque: primeiro as linhas já enviadas, depois as ativas
  cart.forEach(l => { if (!l.sent) l.qty = Math.min(l.qty, stockOf(findProduct(l.id), l.size)); });
  cart = cart.filter(l => l.sent || l.qty > 0);
} catch { cart = []; }
const saveCart = () => { safeStorage.local.put(CART_KEY, JSON.stringify(cart)); };
// Linhas ativas são as que ainda não foram enviadas
const activeLines = () => cart.filter(l => !l.sent);
const lineFor = (id, size) => cart.find(l => l.id === id && l.size === size && !l.sent);
const totalQty = () => activeLines().reduce((t, l) => t + l.qty, 0);
const cartTotal = () => activeLines().reduce((t, l) => t + unitPrice(findProduct(l.id)) * l.qty, 0);
// Quantidade de um tamanho já enviada neste navegador
function sentQty(id, size) {
  return cart.filter(l => l.sent && l.id === id && l.size === size).reduce((t, l) => t + l.qty, 0);
}
