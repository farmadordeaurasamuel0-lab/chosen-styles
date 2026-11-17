/* ===== Seletor de quantidade (página do produto) =====
 * Funciona como um contador nativo: o primeiro toque já conta, e segurar repete.
 * O limite é o menor valor entre 10 peças e o estoque do tamanho, descontando o que já está na sacola.
 */
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let qtyHoldDelay = null;
let qtyHoldRepeat = null;

// Quantas unidades ainda cabem na sacola para este produto e tamanho
function qtyMax(product, size) {
  const inBag = lineFor(product.id, size)?.qty ?? 0;
  const stock = stockOf(product, size);
  const cap = Number.isFinite(stock) ? Math.min(QTY_MAX, stock) : QTY_MAX;
  return Math.max(0, cap - inBag);
}

function qtyStepperHtml() {
  return '<div class="qty-stepper" id="pv-qty" role="group" aria-labelledby="pv-qty-label">'
    + '<span class="qty-stepper-title" id="pv-qty-label">Quantidade</span>'
    + '<div class="qty-stepper-control">'
    + '<button class="qty-step" type="button" data-qty-step="-1" aria-label="Diminuir quantidade" aria-disabled="true">' + QTY_ICON_MINUS + '</button>'
    + '<div class="qty-stepper-value" id="pv-qty-value" aria-live="polite" aria-atomic="true"><span class="qty-digit">' + pvQty + '</span></div>'
    + '<button class="qty-step" type="button" data-qty-step="1" aria-label="Aumentar quantidade" aria-disabled="true">' + QTY_ICON_PLUS + '</button>'
    + '</div>'
    + '<p class="qty-stepper-hint" id="pv-qty-hint">Escolha um tamanho para ajustar a quantidade.</p>'
    + '</div>';
}

function qtyHint(hasSize, max) {
  if (!hasSize) return "Escolha um tamanho para ajustar a quantidade.";
  if (max < 1) return "Sem unidades disponíveis neste tamanho.";
  if (pvQty >= max) {
    if (max < QTY_MAX) return "Restam " + max + (max === 1 ? " unidade" : " unidades") + " neste tamanho.";
    return "Limite de " + QTY_MAX + " peças por tamanho.";
  }
  return "Segure para ajustar mais rápido.";
}

// Atualiza botões, número e texto de apoio. Com clamp, ajusta a quantidade ao limite atual.
function syncQtyStepper(clamp = false) {
  const root = $("pv-qty");
  if (!root || !pvProduct) return;
  const hasSize = Boolean(pvSize);
  const max = hasSize ? qtyMax(pvProduct, pvSize) : 0;
  if (clamp && hasSize) pvQty = Math.min(pvQty, Math.max(1, max));
  const shown = $("pv-qty-value").querySelector(".qty-digit:not(.is-leaving)");
  if (shown) shown.textContent = String(pvQty);
  const off = !hasSize || max < 1;
  root.querySelector('[data-qty-step="-1"]').setAttribute("aria-disabled", String(off || pvQty <= 1));
  root.querySelector('[data-qty-step="1"]').setAttribute("aria-disabled", String(off || pvQty >= max));
  $("pv-qty-hint").textContent = qtyHint(hasSize, max);
}

function shakeQty(direction) {
  if (reduceMotion()) return;
  $("pv-qty-value").animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(" + 5 * direction + "px)" },
      { transform: "translateX(" + -3 * direction + "px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 300, easing: "ease-out" },
  );
}

function pulseQtyButton(button) {
  if (reduceMotion()) return;
  button.animate(
    [{ transform: "scale(1)" }, { transform: "scale(.88)" }, { transform: "scale(1)" }],
    { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" },
  );
}

// Troca o número com deslizamento: o antigo sai no sentido da contagem e o novo entra
function setQtyValue(value, direction) {
  pvQty = value;
  const box = $("pv-qty-value");
  const previous = box.querySelector(".qty-digit:not(.is-leaving)");
  const digit = document.createElement("span");
  digit.className = "qty-digit";
  digit.textContent = String(value);
  box.append(digit);
  if (previous) {
    previous.classList.add("is-leaving");
    if (reduceMotion()) {
      previous.remove();
    } else {
      previous.animate(
        [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(" + -16 * direction + "px)", opacity: 0 }],
        { duration: 180, easing: "ease-in", fill: "forwards" },
      ).onfinish = () => previous.remove();
    }
  }
  if (!reduceMotion()) {
    digit.animate(
      [{ transform: "translateY(" + 16 * direction + "px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
      { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  }
  syncQtyStepper();
}

// Um passo do contador. Devolve false quando não há o que mudar (limite ou sem tamanho).
function stepQty(direction) {
  if (!pvProduct || !pvSize) return false;
  const max = qtyMax(pvProduct, pvSize);
  const next = Math.min(Math.max(1, max), Math.max(1, pvQty + direction));
  if (max < 1 || next === pvQty) {
    shakeQty(direction);
    return false;
  }
  setQtyValue(next, direction);
  return true;
}

function stopQtyHold() {
  clearTimeout(qtyHoldDelay);
  clearInterval(qtyHoldRepeat);
  qtyHoldDelay = null;
  qtyHoldRepeat = null;
}

// Toque ou clique do mouse: conta na hora e, se continuar pressionado, repete
pvEl.addEventListener("pointerdown", e => {
  const button = e.target.closest("[data-qty-step]");
  if (!button || e.button !== 0) return;
  const direction = Number(button.dataset.qtyStep);
  if (button.getAttribute("aria-disabled") === "true") {
    if (pvSize) shakeQty(direction);
    return;
  }
  stopQtyHold();
  if (stepQty(direction)) pulseQtyButton(button);
  // Depois de 400 ms segurando, o valor passa a repetir a cada 80 ms
  qtyHoldDelay = setTimeout(() => {
    qtyHoldRepeat = setInterval(() => {
      if (!stepQty(direction)) stopQtyHold();
    }, 80);
  }, 400);
});
document.addEventListener("pointerup", stopQtyHold);
document.addEventListener("pointercancel", stopQtyHold);

// Teclado (Enter ou Espaço) gera clique com detail 0; cliques do ponteiro já foram tratados no pointerdown
pvEl.addEventListener("click", e => {
  const button = e.target.closest("[data-qty-step]");
  if (!button || e.detail !== 0) return;
  const direction = Number(button.dataset.qtyStep);
  if (button.getAttribute("aria-disabled") === "true") {
    if (pvSize) shakeQty(direction);
    return;
  }
  if (stepQty(direction)) pulseQtyButton(button);
});
