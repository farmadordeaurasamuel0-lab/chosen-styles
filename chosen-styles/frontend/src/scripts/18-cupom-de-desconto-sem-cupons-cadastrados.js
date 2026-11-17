/* ===== Cupom de desconto (sem cupons cadastrados) ===== */
const couponForm = $("coupon-form");
const couponInput = $("coupon-input");
const couponStatus = $("coupon-status");
couponForm.addEventListener("submit", e => {
  e.preventDefault();
  const code = couponInput.value.trim();
  if (!code) {
    couponStatus.textContent = "Digite um código de cupom.";
    return;
  }
  couponStatus.textContent = "Cupons ainda não estão disponíveis. Nenhum desconto foi aplicado.";
});
