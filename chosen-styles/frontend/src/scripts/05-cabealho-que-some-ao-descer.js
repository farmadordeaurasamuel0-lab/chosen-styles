/* ===== Cabeçalho que some ao descer ===== */
const header = $("header");
let lastY = 0, headerFrame = 0;
const onHeaderScroll = () => {
  headerFrame = 0;
  const y = scrollY;
  if (document.body.classList.contains("is-locked")) { lastY = y; return; }
  if (y > lastY && y > 150) header.classList.add("is-hidden");
  else if (y < lastY || y < 150) header.classList.remove("is-hidden");
  lastY = y;
};
