/* ===== Curtidas (salvas somente neste navegador) ===== */
const LIKES_KEY = "cs:likes";
const HEART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.5s-7.5-4.6-7.5-10.1C4.5 7.5 6.6 5.5 9 5.5c1.4 0 2.4.7 3 1.6.6-.9 1.6-1.6 3-1.6 2.4 0 4.5 2 4.5 4.9 0 5.5-7.5 10.1-7.5 10.1z"/></svg>';
function readLikes() {
  try {
    const list = JSON.parse(safeStorage.local.get(LIKES_KEY) || "[]");
    return Array.isArray(list) ? list.filter(id => typeof id === "string" && findProduct(id)) : [];
  } catch { return []; }
}
let likes = readLikes();
const isLiked = id => likes.indexOf(id) !== -1;
function likeButtonHtml(id) {
  return '<button class="like-btn" type="button" data-like="' + id + '" aria-pressed="false" aria-label="Curtir"><span class="like-icon">' + HEART_ICON + '</span></button>';
}
function syncLikes() {
  document.querySelectorAll("[data-like]").forEach(btn => {
    const on = isLiked(btn.dataset.like);
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-label", on ? "Remover curtida" : "Curtir");
  });
}
function toggleLike(id) {
  likes = isLiked(id) ? likes.filter(x => x !== id) : likes.concat([id]);
  safeStorage.local.put(LIKES_KEY, JSON.stringify(likes));
  syncLikes();
}
/* Curtir: o coração estala, um anel dourado se expande e faixas de luz saem do centro.
 * Só os elementos de animação são criados, e são removidos ao terminar. Descurtir apenas encolhe o coração. */
function likeFx(btn, on) {
  const icon = btn.querySelector("svg");
  if (icon) {
    icon.animate(on
      ? [{ transform: "scale(.55)" }, { transform: "scale(1.35)" }, { transform: "scale(.92)" }, { transform: "scale(1)" }]
      : [{ transform: "scale(1)" }, { transform: "scale(.8)" }, { transform: "scale(1)" }],
      { duration: on ? 520 : 260, easing: on ? "cubic-bezier(.3,1.5,.5,1)" : "ease-out" });
  }
  if (!on) return;
  const fx = document.createElement("span");
  fx.className = "like-fx";
  fx.setAttribute("aria-hidden", "true");
  const ring = document.createElement("span");
  ring.className = "like-ring";
  fx.appendChild(ring);
  ring.animate([{ transform: "scale(1)", opacity: 0.9 }, { transform: "scale(2.6)", opacity: 0 }], { duration: 650, easing: "ease-out" });
  for (let i = 0; i < 8; i += 1) {
    const spark = document.createElement("span");
    spark.className = "like-spark";
    fx.appendChild(spark);
    const angle = (Math.PI * 2 * i) / 8 + 0.2;
    const dist = 34 + (i % 2) * 10;
    const dx = (Math.cos(angle) * dist).toFixed(1);
    const dy = (Math.sin(angle) * dist).toFixed(1);
    spark.animate([
      { transform: "translate(0,0) scale(.4)", opacity: 1 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(1)", opacity: 0 }
    ], { duration: 700, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
  }
  btn.appendChild(fx);
  setTimeout(() => fx.remove(), 800);
}
// Captura antes da grade, para o clique na curtida não abrir a página do produto.
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-like]");
  if (!btn) return;
  e.stopPropagation();
  e.preventDefault();
  toggleLike(btn.dataset.like);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) likeFx(btn, isLiked(btn.dataset.like));
}, true);
document.querySelectorAll(".product").forEach(card => {
  const media = card.querySelector(".product-media");
  if (media && !media.querySelector(".like-btn")) media.insertAdjacentHTML("beforeend", likeButtonHtml(card.dataset.id));
});
new MutationObserver(() => {
  const info = $("pv-info");
  if (!info.querySelector(".like-btn") && typeof pvProduct === "object" && pvProduct) {
    info.insertAdjacentHTML("afterbegin", likeButtonHtml(pvProduct.id));
  }
  syncLikes();
}).observe($("pv-info"), { childList: true });
syncLikes();

/* ===== Busca de produtos ===== */
const searchDialog = $("search");
const searchInput = $("search-input");
const searchResults = $("search-results");
const searchStatus = $("search-status");
function foldText(text) {
  return String(text).toLowerCase().normalize("NFD").split("").filter(ch => {
    const code = ch.charCodeAt(0);
    return code < 768 || code > 879;
  }).join("");
}
function runSearch() {
  const query = foldText(searchInput.value.trim());
  searchResults.innerHTML = "";
  if (!query) {
    searchStatus.textContent = "Digite o nome de uma peça.";
    return;
  }
  const found = PRODUCTS.filter(p => {
    const collection = COLLECTIONS.find(c => c.id === p.collection);
    const haystack = foldText([p.name, p.desc, collection ? collection.label : ""].join(" "));
    return haystack.indexOf(query) !== -1;
  });
  searchStatus.textContent = found.length === 0
    ? "Nenhuma peça encontrada para essa busca."
    : found.length + (found.length === 1 ? " peça encontrada." : " peças encontradas.");
  found.forEach(p => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#produto-" + p.id;
    const thumb = document.createElement("img");
    thumb.className = "res-thumb";
    thumb.src = p.image;
    thumb.alt = "";
    thumb.width = 52;
    thumb.height = 64;
    thumb.loading = "lazy";
    const name = document.createElement("span");
    name.className = "res-name";
    name.textContent = p.name;
    const price = document.createElement("span");
    price.className = "res-price";
    price.textContent = p.price === null ? "Preço em breve" : fmt(p.price);
    link.appendChild(thumb);
    link.appendChild(name);
    link.appendChild(price);
    li.appendChild(link);
    searchResults.appendChild(li);
  });
}
$("search-btn").addEventListener("click", () => {
  searchDialog.showModal();
  searchInput.focus();
});
$("search-close").addEventListener("click", () => searchDialog.close());
searchDialog.addEventListener("click", e => { if (e.target === searchDialog) searchDialog.close(); });
searchInput.addEventListener("input", runSearch);
searchResults.addEventListener("click", e => {
  if (e.target.closest("a")) searchDialog.close();
});
