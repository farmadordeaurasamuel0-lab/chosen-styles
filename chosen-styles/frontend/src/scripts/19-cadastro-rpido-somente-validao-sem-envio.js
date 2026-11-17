/* ===== Cadastro rápido (somente validação, sem envio) ===== */
const signupForm = $("signup-form");
const signupError = $("signup-error");
const signupStatus = $("signup-status");
function validateSignup() {
  const name = signupForm.fullname, email = signupForm.email;
  const errors = [];
  const cep = signupForm.cep;
  name.removeAttribute("aria-invalid");
  email.removeAttribute("aria-invalid");
  cep.removeAttribute("aria-invalid");
  if (name.value.trim().length < 2) { errors.push("Informe seu nome completo."); name.setAttribute("aria-invalid", "true"); }
  const v = email.value.trim();
  const at = v.indexOf("@");
  const emailOk = at > 0 && v.indexOf("@", at + 1) === -1 && v.indexOf(".", at) > at + 1 && v.lastIndexOf(".") < v.length - 2 && v.indexOf(" ") === -1;
  if (!emailOk) { errors.push("Informe um e-mail válido."); email.setAttribute("aria-invalid", "true"); }
  if (cep.value.replace(/\D/g, "").length !== 8) { errors.push("Informe um CEP com 8 números."); cep.setAttribute("aria-invalid", "true"); }
  signupError.textContent = errors.join(" ");
  if (errors.length) {
    ([name, email, cep].find(el => el.getAttribute("aria-invalid")) || name).focus();
    signupStatus.textContent = "";
    return false;
  }
  signupStatus.textContent = "Dados válidos.";
  return true;
}
signupForm.addEventListener("submit", e => { e.preventDefault(); validateSignup(); });

const PAY_LABELS = { pix: "Pix", debito: "Cartão de débito", credito: "Cartão de crédito" };
// Parcelamento confirmado pela loja: 3x, juros de 2,5% sobre o total, compra mínima de R$ 45,00
const INSTALL = { parts: 3, rate: 0.025, minCents: 4500 };
const centsText = c => "R$ " + (c / 100).toFixed(2).replace(".", ",");
function installmentPlan() {
  const totalCents = Math.round(cartTotal() * 100);
  if (totalCents < INSTALL.minCents) return null;
  const withInterest = Math.round(totalCents * (1 + INSTALL.rate));
  const base = Math.floor(withInterest / INSTALL.parts);
  const last = withInterest - base * (INSTALL.parts - 1);
  return { totalCents, withInterest, base, last };
}
function installmentDetail() {
  const plan = installmentPlan();
  if (!plan) return "parcelamento disponível a partir de R$ 45,00 em compras.";
  return INSTALL.parts + "x de " + centsText(plan.base) + " (a última de " + centsText(plan.last) + "), total com juros de " + centsText(plan.withInterest) + ".";
}
function renderReview(payKey) {
  lastPayKey = payKey;
  const list = $("review-list");
  list.innerHTML = "";
  cart.forEach(l => {
    const p = findProduct(l.id);
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = p.name + " · " + l.size + " × " + l.qty;
    const value = document.createElement("span");
    value.textContent = fmt(unitPrice(p) * l.qty);
    li.appendChild(label);
    li.appendChild(value);
    list.appendChild(li);
  });
  $("review-total").textContent = "Total: " + fmt(cartTotal());
  $("review-pay").textContent = payKey === "credito"
    ? "Pagamento: " + PAY_LABELS[payKey] + ". À vista: " + fmt(cartTotal()) + ". Em " + installmentDetail()
    : "Pagamento: " + PAY_LABELS[payKey] + ". Ainda não processado.";
  $("confirm-status").textContent = "";
  $("confirm-btn").textContent = CONTACT.whatsapp ? "Finalizar pelo WhatsApp" : "Atendimento em configuração";
  $("confirm-btn").disabled = !CONTACT.whatsapp;
  $("review").hidden = false;
}
// Primeiro os dados pessoais (são o que falta com mais frequência), depois a forma de pagamento
$("review-btn").addEventListener("click", () => {
  if (!validateSignup()) return;
  const selected = Array.from(document.querySelectorAll('input[name="pay"]')).find(r => r.checked);
  if (!selected) {
    $("payment-note").textContent = "Escolha a forma de pagamento.";
    return;
  }
  $("payment-note").textContent = "";
  renderReview(selected.value);
});
// Trocar a forma de pagamento atualiza o resumo se ele já estiver aberto, e o pedido usa sempre a escolha atual
document.querySelectorAll('input[name="pay"]').forEach(radio => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    $("payment-note").textContent = "";
    if ($("review").hidden) lastPayKey = radio.value;
    else renderReview(radio.value);
  });
});
const ORDERS_KEY = "cs:orders";
// Sem administradores configurados no frontend. A verificação real exige autenticação no servidor (Supabase Auth).
const ADMIN_EMAILS = [];
let lastPayKey = "pix";
function readOrders() {
  try {
    const list = JSON.parse(safeStorage.local.get(ORDERS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}
function writeOrders(list) {
  return safeStorage.local.put(ORDERS_KEY, JSON.stringify(list));
}
let confirmBusy = false;
$("confirm-btn").addEventListener("click", () => {
  if (confirmBusy || !cart.length) return;
  confirmBusy = true;
  $("confirm-btn").disabled = true;
  $("confirm-btn").setAttribute("aria-busy", "true");
  try {
    if (CONTACT.whatsapp) openWhatsAppOrder();
  } finally {
    confirmBusy = false;
    $("confirm-btn").disabled = false;
    $("confirm-btn").removeAttribute("aria-busy");
  }
});
function buildWhatsAppOrderText() {
  const lines = activeLines().map(l => {
    const p = findProduct(l.id);
    const unit = unitPrice(p);
    return "- " + p.name + " · tamanho " + l.size + " × " + l.qty + " = " + fmt(unit * l.qty);
  });
  const name = signupForm.fullname.value.trim();
  const email = normEmail(signupForm.email.value);
  const payment = PAY_LABELS[lastPayKey] || "a combinar";
  return [
    "Olá! Quero finalizar meu pedido na Chosen Styles.",
    "",
    "Itens:",
    ...lines,
    "",
    "Total: " + fmt(cartTotal()),
    "Forma de pagamento escolhida: " + payment,
    ...(lastPayKey === "credito" ? ["Parcelamento: " + installmentDetail()] : []),
    "Nome: " + name,
    "E-mail: " + email,
    "CEP de entrega: " + signupForm.cep.value.trim(),
    "Frete: a calcular pela loja a partir do CEP informado.",
    "",
    "Aguardo a confirmação de estoque e o pagamento."
  ].join("\n");
}
function openWhatsAppOrder() {
  const lines = activeLines();
  const overStock = lines.find(l => l.qty > stockOf(findProduct(l.id), l.size));
  if (!lines.length || overStock) {
    $("confirm-status").textContent = "Algum item não tem mais estoque suficiente. Ajuste a sacola antes de finalizar.";
    return;
  }
  const url = "https://wa.me/" + CONTACT.whatsapp + "?text=" + encodeURIComponent(buildWhatsAppOrderText());
  // Sem "noopener": o navegador precisa devolver a janela para sabermos se ela abriu
  const opened = window.open(url, "_blank");
  if (!opened) {
    $("confirm-status").textContent = "Não conseguimos abrir o WhatsApp. Verifique se o navegador bloqueou a janela e toque em Finalizar de novo.";
    return;
  }
  try { opened.opener = null; } catch { /* navegadores sem acesso à janela */ }
  const orderId = "PED-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    email: normEmail(signupForm.email.value),
    name: signupForm.fullname.value.trim(),
    payment: PAY_LABELS[lastPayKey] || "a combinar",
    items: lines.map(l => {
      const p = findProduct(l.id);
      return { name: p.name, size: l.size, qty: l.qty, unit: unitPrice(p) };
    }),
    total: cartTotal(),
    status: "enviado"
  };
  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);
  lines.forEach(l => { l.sent = orderId; });
  saveCart();
  updateBadge();
  renderCart();
  window.dispatchEvent(new Event("cs:orders-changed"));
  // Atualiza o que já está na tela: vitrine e tamanhos da página aberta (o estoque mostrado mudou)
  renderGrid();
  if (pvProduct) renderProduct(pvProduct);
  $("confirm-status").textContent = "Pedido enviado com sucesso. Ele aparece em Minha conta. A loja confirma o pagamento com você pelo WhatsApp.";
}
