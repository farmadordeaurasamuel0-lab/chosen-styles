/* ===== Condições comerciais (edite aqui quando as decisões forem tomadas) =====
 * Enquanto uma informação não estiver definida, deixe o campo vazio: o item correspondente
 * fica oculto no site. Nenhum texto "a definir" é exibido ao cliente.
 * Exemplos quando definidos: frete: "Frete calculado pelo CEP, na finalização do pedido".
 */
const STORE_TERMS = {
  frete: "Entrega pelos Correios · Frete pelo CEP",
  pagamento: "Pix, débito e crédito",
  parcelamento: "Até 3x · juros de 2,5% · mínimo R$ 45"
};
document.querySelectorAll("[data-info]").forEach(el => {
  const value = STORE_TERMS[el.dataset.info];
  if (value) {
    el.textContent = value;
  } else {
    const item = el.closest(".trust-item");
    if (item) item.hidden = true;
  }
});
const trustList = document.querySelector(".trust");
if (trustList && !trustList.querySelector(".trust-item:not([hidden])")) trustList.hidden = true;

/* Trocas e reembolso: preencha quando a política estiver definida. Sem texto, o trecho fica oculto. */
const RETURNS_TERMS = {
  troca: "",
  reembolso: "",
  condicoes: ""
};
document.querySelectorAll("[data-returns]").forEach(el => {
  const value = RETURNS_TERMS[el.dataset.returns];
  if (value) {
    el.textContent = value;
  } else {
    const step = el.closest("li");
    if (step) step.hidden = true;
    if (el.dataset.returns === "condicoes") {
      const note = el.closest(".returns-note");
      if (note) note.hidden = true;
    }
  }
});
