/* ===== Camisetas: animação ligada à rolagem =====
 * Cada foto começa ampliada e deslocada para baixo, e se acomoda no lugar conforme entra na tela.
 * Usa apenas transform (propriedades `scale` e `translate`), compostas pela GPU, sem recorte.
 * Faz parte do ciclo único de rolagem. Com movimento reduzido, as fotos ficam no lugar.
 */
const shirtReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Onde a animação nativa funciona (CSS), este script não roda nada a cada quadro.
const shirtNative = typeof CSS !== "undefined" && CSS.supports("animation-timeline", "view()");
const paintShirts = () => {
  const shirtImages = document.querySelectorAll("#grid .product-media img");
  shirtImages.forEach(img => {
    if (shirtReduce) {
      img.style.scale = "";
      img.style.translate = "";
      return;
    }
    const media = img.closest(".product-media");
    const rect = media.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = Math.min(1, Math.max(0, (innerHeight - rect.top) / (innerHeight * 0.8)));
    img.style.scale = (1.16 - 0.16 * progress).toFixed(4);
    img.style.translate = "0 " + ((1 - progress) * 3).toFixed(2) + "%";
  });
};
if (!shirtNative) {
  onScrollFrame(paintShirts);
  paintShirts();
}
