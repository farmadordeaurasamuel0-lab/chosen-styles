/* ===== Notificações ===== */
const toastEl = $("toast");
let toastTimer = 0;
const toast = msg => {
  toastEl.textContent = msg;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2400);
};
