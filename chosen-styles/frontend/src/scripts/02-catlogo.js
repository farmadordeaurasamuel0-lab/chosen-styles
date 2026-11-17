/* ===== Catálogo ===== */
const PRODUCTS = [
  { id: "essential-offwhite", collection: "inaugural", num: "01", numTone: "light", comingSoon: false, name: "CRISTÃ Essential — Off-White", desc: "Camiseta em tom off-white com cruz discreta no peito. Na etiqueta interna, a frase “Propósito em cada detalhe”. No verso, as palavras FÉ, PROPÓSITO e IDENTIDADE em tipografia fina e centralizada.", image: ASSETS["essential-offwhite-front.webp"], imageAlt: ASSETS["essential-offwhite-back.webp"], front: ASSETS["essential-offwhite-front.webp"], back: ASSETS["essential-offwhite-back.webp"], specs: { material: "", modelagem: "", cuidados: "" }, price: 140, promo: null, stock: { P: 15, M: 4, G: 1, GG: 6 } },
  { id: "essential-black", collection: "inaugural", num: "02", comingSoon: false, name: "CRISTÃ Essential — Black", desc: "Peça em tom charcoal, com aparência desbotada. No peito, a marca CRISTÃ em tipografia clássica acompanhada de uma cruz. No verso, a frase “Fé que transforma identidades”.", image: ASSETS["essential-black-front.webp"], imageAlt: ASSETS["essential-black-back.webp"], front: ASSETS["essential-black-front.webp"], back: ASSETS["essential-black-back.webp"], specs: { material: "", modelagem: "", cuidados: "" }, price: 140, promo: null, stock: { P: 1, M: 18, G: 22, GG: 7 } }
];
// stock: null = quantidade ainda não informada (sem limite de unidades).
/* MODO DE TESTE: permite comprar peças sem estoque confirmado, apenas para demonstração.
 * Nenhuma cobrança é feita e o pedido fica salvo só neste navegador.
 * Antes de vender de verdade, troque para false e informe o estoque real por tamanho.
 */
const DEMO_PURCHASE = false;
// Estoque não informado (stock: null) é indisponível, exceto no modo de teste.
const stockOf = (p, size) => {
  const base = p.stock === null ? (DEMO_PURCHASE ? Infinity : 0) : p.stock[size];
  if (!Number.isFinite(base)) return base;
  // Unidades de pedidos já enviados neste navegador saem do estoque mostrado até a loja confirmar
  return Math.max(0, base - sentQty(p.id, size));
};
const hasStock = p => (p.stock === null ? DEMO_PURCHASE : Object.values(p.stock).some(q => q > 0));
const stockStatusLabel = p => {
  if (p.stock === null) return DEMO_PURCHASE ? "Modo de teste" : "Estoque a confirmar";
  return hasStock(p) ? "Disponível" : "Esgotado";
};
const findProduct = id => PRODUCTS.find(p => p.id === id);
const COLLECTIONS = [
  { id: "todas", label: "Todas" },
  { id: "inaugural", label: "CRISTÃ Essential" },
  { id: "essenciais", label: "Essenciais (em preparação)" }
];
