/* ===== Abas de coleção ===== */
const collectionFilter = (collectionId) => (productId) => {
  const product = findProduct(productId);
  return collectionId === "todas" || (product !== undefined && product.collection === collectionId);
};
const tabsEl = $("collection-tabs");
let activeCollection = "todas";
tabsEl.innerHTML = COLLECTIONS.map(c => `<button class="ctab" type="button" data-collection="${c.id}" aria-pressed="${c.id === activeCollection}">${c.label}</button>`).join("");
tabsEl.addEventListener("click", e => {
  const btn = e.target.closest("[data-collection]");
  if (!btn) return;
  activeCollection = btn.dataset.collection;
  tabsEl.querySelectorAll("[data-collection]").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
  productGrid.apply(collectionFilter(activeCollection));
});
