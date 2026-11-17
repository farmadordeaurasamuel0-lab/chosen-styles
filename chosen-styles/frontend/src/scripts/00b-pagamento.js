/* ===== Integração de pagamento (contrato preparado, sem provedor escolhido) =====
 * Nenhum provedor está configurado. Enquanto `configured` for false, o site
 * não cobra nada e não marca pedidos como pagos.
 * Ao escolher o provedor, a criação do pagamento deve ocorrer no servidor
 * (nunca no navegador), e o pedido só vira "pago" após confirmação do webhook.
 */
const PAYMENT_PROVIDER = {
  name: "",
  configured: false,
  createCheckout() {
    return Promise.reject(new Error("Nenhum provedor de pagamento configurado."));
  }
};
