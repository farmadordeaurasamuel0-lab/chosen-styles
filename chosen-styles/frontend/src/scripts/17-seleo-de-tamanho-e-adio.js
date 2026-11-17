/* ===== Seleção de tamanho e adição ===== */
const selections = {};
let adding = false;

grid.addEventListener("click", async e => {
  const card = e.target.closest(".product");
  if (!card) return;
  const id = card.dataset.id;
  if (e.target.closest("[data-details], .product-media")) {
    openProductDetails(id);
    return;
  }
  const product = findProduct(id);
  const errorEl = card.querySelector(".field-error");

  const sizeBtn = e.target.closest("[data-size]");
  if (sizeBtn) {
    selections[id] = sizeBtn.dataset.size;
    card.querySelectorAll("[data-size]").forEach(b => b.setAttribute("aria-pressed", String(b === sizeBtn)));
    errorEl.textContent = "";
    return;
  }

  if (!e.target.closest("[data-add]") || adding) return;
  const size = selections[id];
  if (!size) { errorEl.textContent = "Selecione um tamanho para continuar."; return; }
  const current = lineFor(id, size)?.qty ?? 0;
  if (current >= stockOf(product, size)) {
    errorEl.textContent = `Não há mais unidades no tamanho ${size}.`;
    return;
  }

  adding = true;
  const addBtn = card.querySelector("[data-add]");
  addBtn.disabled = true;
  try {
    await flyToCart(card.querySelector(".product-media"), product.image);
    const line = lineFor(id, size);
    if (line) line.qty += 1;
    else cart.push({ id, size, qty: 1 });
    saveCart();
    updateBadge();
    toast(`${product.name}, tamanho ${size}, adicionada à sacola`);
  } finally {
    addBtn.disabled = false;
    adding = false;
  }
});
