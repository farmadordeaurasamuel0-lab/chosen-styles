/* ===== Botões com texto rotativo ===== */
document.querySelectorAll(".rt-btn").forEach(btn => {
  if (reduce) return;
  btn.addEventListener("pointerenter", () => btn.classList.add("is-active"));
  btn.addEventListener("pointerleave", () => { if (!btn.matches(":focus-visible")) btn.classList.remove("is-active"); });
  btn.addEventListener("focus", () => btn.classList.add("is-active"));
  btn.addEventListener("blur", () => btn.classList.remove("is-active"));
});
