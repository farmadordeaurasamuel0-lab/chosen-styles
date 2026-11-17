/* ===== Carrinho lateral ===== */
const drawer = $("drawer");
const overlay = $("overlay");
const cartBtn = $("cart-btn");
let drawerOpen = false;
// Trava a rolagem da página enquanto a sacola está aberta
const setLock = on => document.body.classList.toggle("is-locked", on);

function openCart() {
  if (drawerOpen) return;
  drawerOpen = true;
  renderCart();
  overlay.classList.add("is-open");
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  setLock(true);
  $("drawer-close").focus({ preventScroll: true });
}
function closeCart() {
  if (!drawerOpen) return;
  drawerOpen = false;
  overlay.classList.remove("is-open");
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  setLock(false);
  cartBtn.focus();
}
cartBtn.addEventListener("click", openCart);
$("drawer-close").addEventListener("click", closeCart);
$("cart-empty-cta").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

/* Foco preso dentro do carrinho enquanto aberto */
drawer.addEventListener("keydown", e => {
  if (e.key !== "Tab" || !drawerOpen) return;
  // Só elementos visíveis entram no ciclo de foco (os ocultos do rodapé da sacola não podem ser o último)
  const items = [...drawer.querySelectorAll("button:not([disabled]), a[href]")].filter(el => el.getClientRects().length > 0);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (drawerOpen) closeCart();
});

function updateBadge() {
  const n = totalQty();
  $("cart-count").textContent = n;
  cartBtn.setAttribute("aria-label", `Abrir carrinho, ${n} ${n === 1 ? "item" : "itens"}`);
  // Ao adicionar uma peça, o cabeçalho volta a aparecer para o cliente ver a sacola atualizada
  const siteHeader = document.querySelector(".site-header");
  if (siteHeader && n > 0) siteHeader.classList.remove("is-hidden");
}

function renderCart() {
  const reviewEl = $("review");
  if (reviewEl) reviewEl.hidden = true;
  const list = $("cart-items");
  const empty = $("cart-empty");
  const foot = $("drawer-foot");
  const active = activeLines();
  if (!cart.length) {
    list.innerHTML = "";
    empty.hidden = false;
    foot.hidden = true;
    $("cart-total").textContent = fmt(0);
    return;
  }
  empty.hidden = true;
  foot.hidden = active.length === 0;
  const check = '<svg class="sent-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  list.innerHTML = cart.map((l, i) => {
    const p = findProduct(l.id);
    const max = stockOf(p, l.size);
    const image = p.image ? `<img src="${p.image}" alt="" width="72" height="90" style="width:100%;height:100%;object-fit:cover">` : "";
    const info = l.sent
      ? `<span class="sent-status">${check}Pedido enviado · ${l.sent}</span>`
      : `<div class="qty" role="group" data-line="${p.id}-${l.size}" aria-label="Quantidade de ${p.name}, tamanho ${l.size}">
            <button type="button" data-act="dec" data-idx="${i}" aria-label="Diminuir">−</button>
            <span aria-live="polite">${l.qty}</span>
            <button type="button" data-act="inc" data-idx="${i}" aria-label="Aumentar" ${l.qty >= max ? "disabled" : ""}>+</button>
          </div>`;
    return `
      <li class="cart-line${l.sent ? " is-sent" : ""}">
        <div class="cart-thumb" aria-hidden="true">${image}</div>
        <div class="cart-info">
          <strong>${p.name}</strong>
          <small>Tamanho ${l.size} · ${fmt(unitPrice(p))}</small>
          ${info}
        </div>
        <div class="line-end">
          <strong>${fmt(unitPrice(p) * l.qty)}</strong>
          <button type="button" data-act="rm" data-idx="${i}">Remover</button>
        </div>
      </li>`;
  }).join("") + (active.length === 0
    ? '<li class="cart-note">Pedido enviado. Escolha novas peças para comprar de novo.</li>'
    : "");
  $("cart-total").textContent = fmt(cartTotal());
  enterCartLines();
}

/* Entrada escalonada das peças do carrinho (somente visual, respeita movimento reduzido). */
function enterCartLines() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("#cart-items .cart-line").forEach((line, index) => {
    line.animate(
      [{ opacity: 0, transform: "translateX(24px)" }, { opacity: 1, transform: "none" }],
      { duration: 480, delay: 90 + index * 70, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" }
    );
  });
}

$("cart-items").addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const line = cart[Number(btn.dataset.idx)];
  if (!line || (line.sent && btn.dataset.act !== "rm")) return;
  const max = stockOf(findProduct(line.id), line.size);
  if (btn.dataset.act === "inc" && line.qty < max) line.qty += 1;
  if (btn.dataset.act === "dec") line.qty -= 1;
  if (btn.dataset.act === "rm" || line.qty <= 0) cart = cart.filter(l => l !== line);
  saveCart();
  updateBadge();
  renderCart();
  if (btn.dataset.act !== "rm") {
    const counter = document.querySelector('#cart-items .qty[data-line="' + line.id + '-' + line.size + '"] span');
    if (counter) {
      counter.classList.remove("bump");
      void counter.offsetWidth;
      counter.classList.add("bump");
    }
  }
});
