/* ===== Remoção do carregamento inicial ===== */
const hideLoader = () => {
  const loader = $("loader");
  if (!loader) return;
  document.documentElement.classList.remove("is-loading");
  loader.classList.add("is-done");
  setTimeout(() => loader.remove(), 480);
};
if (document.readyState === "complete") hideLoader();
else window.addEventListener("load", hideLoader, { once: true });
