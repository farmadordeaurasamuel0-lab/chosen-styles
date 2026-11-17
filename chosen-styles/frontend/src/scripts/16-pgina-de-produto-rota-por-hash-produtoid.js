/* ===== Página de produto (rota por hash: #produto-<id>) ===== */
const pvEl = $("pv");
const mainEl = $("conteudo");
const footerEl = document.querySelector(".site-footer");
const DEFAULT_TITLE = document.title;
const VIEWS = [{ key: "front", label: "Frente" }, { key: "back", label: "Verso" }];
let pvProduct = null;
let pvView = "front";
let pvSize = null;
let pvBusy = false;
let pvQty = 1;
const QTY_MAX = 10;
const QTY_ICON_MINUS = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M4 9h10"/></svg>';
const QTY_ICON_PLUS = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M4 9h10M9 4v10"/></svg>';

function openProductDetails(productId) {
  location.hash = "produto-" + productId;
}

const stageReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function renderStage(direction = 0) {
  const stage = $("pv-stage");
  const img = $("pv-img");
  const apply = () => {
    const src = pvProduct[pvView];
    const label = VIEWS.find(v => v.key === pvView).label;
    const placeholder = $("pv-placeholder");
    stage.classList.remove("is-zoomed");
    if (src) {
      img.src = src;
      img.alt = pvProduct.name + ", vista de " + label.toLowerCase();
      img.hidden = false;
      placeholder.hidden = true;
      stage.style.cursor = "zoom-in";
    } else {
      img.hidden = true;
      img.removeAttribute("src");
      placeholder.hidden = false;
      placeholder.textContent = "Foto de " + label.toLowerCase() + " pendente de envio";
      stage.style.cursor = "default";
    }
    $("pv-thumbs").querySelectorAll("[data-view]").forEach(btn => {
      btn.setAttribute("aria-selected", String(btn.dataset.view === pvView));
      btn.tabIndex = btn.dataset.view === pvView ? 0 : -1;
    });
  };
  img.getAnimations().forEach(anim => anim.cancel());
  if (stageReduce || direction === 0 || img.hidden) {
    apply();
    return;
  }
  const out = img.animate(
    [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: "translateX(" + (-direction * 40) + "px)" }
    ],
    { duration: 220, easing: "ease-in", fill: "forwards" }
  );
  out.onfinish = () => {
    out.cancel();
    apply();
    img.animate(
      [
        { opacity: 0, transform: "translateX(" + (direction * 40) + "px)" },
        { opacity: 1, transform: "translateX(0)" }
      ],
      { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  };
}

function renderProduct(product) {
  pvProduct = product;
  pvView = "front";
  pvSize = null;
  pvQty = 1;
  const price = product.price === null ? "<span>Preço em breve</span>" : product.promo !== null
    ? "<s>" + fmt(product.price) + "</s><strong>" + fmt(product.promo) + "</strong>"
    : "<strong>" + fmt(product.price) + "</strong>";
  const specs = Object.keys(SPEC_LABELS).map(key =>
    "<div><dt>" + SPEC_LABELS[key] + "</dt><dd>" + (product.specs[key] || "A confirmar") + "</dd></div>"
  ).join("");
  $("pv-thumbs").innerHTML = VIEWS.map(v =>
    '<button class="pv-thumb" type="button" role="tab" data-view="' + v.key + '">' + v.label + "</button>"
  ).join("");
  const sizeButtons = SIZES.map(sz =>
    '<button class="size" type="button" data-pv-size="' + sz + '" aria-pressed="false"' +
    (stockOf(product, sz) === 0 ? " disabled" : "") + ">" + sz + "</button>"
  ).join("");
  $("pv-info").innerHTML = `
    <p class="eyebrow" style="margin:0">Nº ${product.num}</p>
    <h1 id="pv-title" tabindex="-1">${product.name}</h1>
    <p class="price">${price}</p>
    <p class="pv-desc">${product.desc}</p>
    ${DEMO_PURCHASE && product.stock === null ? '<p class="note">Modo de teste: nenhuma compra real é processada e o estoque não está confirmado.</p>' : ""}
    <fieldset class="size-group">
      <legend>Tamanho</legend>
      <div class="sizes">${sizeButtons}</div>
    </fieldset>
    <p class="field-error" id="pv-error" role="alert"></p>
    <p class="note">Imagens conceituais (mockup), não fotografias de peças fabricadas.</p>
    ${qtyStepperHtml()}
    <div class="add-row pv-buy-row"><button class="btn btn-dark buy-btn" type="button" id="pv-add" ${hasStock(product) ? "" : "disabled"}>${hasStock(product) ? "Adicionar à sacola" : stockStatusLabel(product)}</button><button class="btn buy-btn pv-buy-now" type="button" id="pv-buy" ${hasStock(product) ? "" : "disabled"}>Comprar agora</button></div>
    <dl class="specs">${specs}</dl>`;
  renderStage();
}

function addFromView(buyNow) {
  if (pvBusy || !pvProduct) return;
  const error = $("pv-error");
  error.textContent = "";
  if (!pvSize) { error.textContent = "Selecione um tamanho para continuar."; return; }
  const room = qtyMax(pvProduct, pvSize);
  if (room <= 0) { error.textContent = "Não há mais unidades no tamanho " + pvSize + "."; return; }
  const qty = Math.min(pvQty, room);
  pvBusy = true;
  const btn = $("pv-add");
  btn.disabled = true;
  $("pv-buy").disabled = true;
  const product = pvProduct;
  const size = pvSize;
  flyToCart($("pv-stage"), pvProduct[pvView] || pvProduct.front).finally(() => {
    const line = lineFor(product.id, size);
    if (line) line.qty += qty;
    else cart.push({ id: product.id, size, qty });
    saveCart();
    updateBadge();
    toast(product.name + ", tamanho " + size + (qty > 1 ? ": " + qty + " unidades adicionadas à sacola" : ", adicionada à sacola"));
    syncQtyStepper(true);
    btn.disabled = false;
    $("pv-buy").disabled = false;
    pvBusy = false;
    if (buyNow) openCart();
  });
}

pvEl.addEventListener("click", e => {
  const thumb = e.target.closest("[data-view]");
  if (thumb) {
    const from = VIEWS.findIndex(v => v.key === pvView);
    const to = VIEWS.findIndex(v => v.key === thumb.dataset.view);
    pvView = thumb.dataset.view;
    renderStage(Math.sign(to - from));
    return;
  }
  const sizeBtn = e.target.closest("[data-pv-size]");
  if (sizeBtn) {
    pvSize = sizeBtn.dataset.pvSize;
    syncQtyStepper(true);
    pvEl.querySelectorAll("[data-pv-size]").forEach(b => b.setAttribute("aria-pressed", String(b === sizeBtn)));
    $("pv-error").textContent = "";
    return;
  }
  if (e.target.closest("#pv-add")) { addFromView(false); return; }
  if (e.target.closest("#pv-buy")) { addFromView(true); return; }
  const stage = e.target.closest("#pv-stage");
  if (stage && pvProduct && pvProduct[pvView]) stage.classList.toggle("is-zoomed");
});

pvEl.addEventListener("keydown", e => {
  const thumb = e.target.closest("[data-view]");
  if (!thumb || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
  e.preventDefault();
  const idx = VIEWS.findIndex(v => v.key === thumb.dataset.view);
  const step = e.key === "ArrowRight" ? 1 : VIEWS.length - 1;
  const next = VIEWS[(idx + step) % VIEWS.length];
  const direction = Math.sign(VIEWS.indexOf(next) - idx);
  pvView = next.key;
  renderStage(direction);
  $("pv-thumbs").querySelector('[data-view="' + next.key + '"]').focus();
});

pvEl.addEventListener("pointermove", e => {
  const stage = e.target.closest("#pv-stage");
  if (!stage || !stage.classList.contains("is-zoomed")) return;
  const r = stage.getBoundingClientRect();
  stage.style.setProperty("--ox", ((e.clientX - r.left) / r.width * 100) + "%");
  stage.style.setProperty("--oy", ((e.clientY - r.top) / r.height * 100) + "%");
});

function showMain() {
  pvEl.hidden = true;
  $("adm").hidden = true;
  mainEl.hidden = false;
  footerEl.hidden = false;
  document.title = DEFAULT_TITLE;
}
function showProduct(product) {
  renderProduct(product);
  mainEl.hidden = true;
  footerEl.hidden = true;
  $("adm").hidden = true;
  pvEl.hidden = false;
  document.title = product.name + " · Chosen Styles";
  window.scrollTo(0, 0);
  $("pv-title").focus({ preventScroll: true });
}
function hideProduct() {
  const wasOpen = !pvEl.hidden || !$("adm").hidden;
  if (!wasOpen) return;
  showMain();
  const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
  if (target) target.scrollIntoView();
  else window.scrollTo(0, 0);
}
function csvCell(value) {
  let text = String(value);
  if (text && "=+-@".indexOf(text.charAt(0)) !== -1) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
function renderAdmin() {
  const allowed = accUser !== null && ADMIN_EMAILS.indexOf(accUser.email) !== -1;
  $("adm-denied").hidden = allowed;
  $("adm-panel").hidden = !allowed;
  if (!allowed) return;
  const orders = readOrders();
  const rows = $("adm-rows");
  rows.innerHTML = "";
  orders.forEach(order => {
    const tr = document.createElement("tr");
    const cells = [
      new Date(order.createdAt).toLocaleString("pt-BR"),
      order.id,
      order.name,
      order.email,
      order.items.map(i => i.name + " · " + i.size + " × " + i.qty).join("; "),
      fmt(order.total),
      order.payment
    ];
    cells.forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    rows.appendChild(tr);
  });
  $("adm-count").textContent = orders.length + (orders.length === 1 ? " pedido salvo neste navegador." : " pedidos salvos neste navegador.");
}
function showAdmin() {
  mainEl.hidden = true;
  footerEl.hidden = true;
  pvEl.hidden = true;
  $("adm").hidden = false;
  document.title = "Pedidos · Chosen Styles";
  renderAdmin();
  window.scrollTo(0, 0);
}
$("adm-export").addEventListener("click", () => {
  const orders = readOrders();
  const header = ["Data", "Pedido", "Cliente", "E-mail", "Itens", "Total", "Pagamento", "Status"];
  const lines = [header.map(csvCell).join(";")];
  orders.forEach(order => {
    lines.push([
      new Date(order.createdAt).toLocaleString("pt-BR"),
      order.id,
      order.name,
      order.email,
      order.items.map(i => i.name + " · " + i.size + " × " + i.qty).join("; "),
      order.total.toFixed(2).replace(".", ","),
      order.payment,
      order.status
    ].map(csvCell).join(";"));
  });
  const blob = new Blob([String.fromCharCode(65279) + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pedidos-teste.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("adm-clear").addEventListener("click", () => {
  if (!window.confirm("Apagar todos os pedidos de teste salvos neste navegador?")) return;
  writeOrders([]);
  renderAdmin();
});
function route() {
  if (location.hash === "#admin") { showAdmin(); return; }
  const match = location.hash.match(/^#produto-([a-z0-9-]+)$/);
  const product = match ? findProduct(match[1]) : undefined;
  if (product) showProduct(product);
  else hideProduct();
}
addEventListener("hashchange", route);
// Só depois que todos os scripts foram carregados, para que nenhuma variável esteja em uso antes da declaração
document.addEventListener("DOMContentLoaded", route);
