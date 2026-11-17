/* ===== Coleção: renderização ===== */
const grid = $("grid");
function renderGrid() {
  grid.innerHTML = '<p class="empty-state" hidden>Nenhuma peça cadastrada nesta coleção ainda.</p>' + PRODUCTS.map((p, i) => {
  const available = hasStock(p);
  const price = p.price === null ? "<span>Preço em breve</span>" : p.promo !== null
    ? `<s>${fmt(p.price)}</s><strong>${fmt(p.promo)}</strong>`
    : `<strong>${fmt(p.price)}</strong>`;
  return `
    <article class="product reveal" data-id="${p.id}" style="--d:${i * 0.12}s">
      <div class="product-media">
        ${p.image ? `<img class="pm-main" src="${p.image}" alt="${p.name}, representação conceitual" loading="lazy" width="800" height="1000">` : ""}
        ${p.imageAlt ? `<img class="pm-alt" src="${p.imageAlt}" alt="" loading="lazy" width="800" height="1000">` : ""}
        <span class="num${p.numTone === "light" ? " is-light" : ""}">Nº ${p.num}</span>
        <span class="status ${available ? "" : "is-out"}">${stockStatusLabel(p)}</span>
        ${p.image ? "" : `<span class="photo-note">Fotografia principal pendente</span>`}
      </div>
      <h3>${p.name}</h3>
      <p class="desc">${p.desc}</p>
      <button class="details-btn" type="button" data-details>Ver fotos e especificações</button>
      <p class="price">${price}</p>
      <fieldset class="size-group" ${available ? "" : "disabled"}>
        <legend>Tamanho</legend>
        <div class="sizes">
          ${SIZES.map(s => `<button class="size" type="button" data-size="${s}" aria-pressed="false" aria-label="Tamanho ${s}${stockOf(p, s) === 0 ? ", esgotado" : ""}" ${stockOf(p, s) === 0 ? "disabled" : ""}>${s}</button>`).join("")}
        </div>
      </fieldset>
      <p class="field-error" role="alert"></p>
      <div class="add-row"><button class="btn btn-dark buy-btn" type="button" data-add ${available && !p.comingSoon ? "" : "disabled"}>${available ? "Adicionar à sacola" : stockStatusLabel(p)}</button></div>
    </article>`;
}).join("");
  document.querySelectorAll("#grid .reveal").forEach(el => revealIO.observe(el));
}
