/* ===== Mostrar e ocultar senha ===== */
/* A senha continua sendo tratada como senha: a troca de tipo acontece só na tela. */
document.querySelectorAll(".pw-toggle").forEach(btn => {
  const input = btn.parentNode.querySelector("input");
  const setHidden = () => {
    input.type = "password";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Mostrar senha");
    btn.classList.remove("is-on");
  };
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-pressed", String(show));
    btn.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
    btn.classList.toggle("is-on", show);
  });
  const dialog = btn.closest("dialog");
  if (dialog) dialog.addEventListener("close", setHidden);
});
