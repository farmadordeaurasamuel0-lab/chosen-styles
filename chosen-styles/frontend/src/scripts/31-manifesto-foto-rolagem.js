/* ===== Manifesto: foto com zoom que assenta e deslocamento vertical ao rolar =====
 * A foto começa ampliada e assenta no tamanho normal conforme a seção é percorrida,
 * enquanto desliza suavemente na vertical. Ligado à posição na tela, não ao tempo.
 */
const manifestoPhoto = document.querySelector("[data-manifesto-photo]");
if (manifestoPhoto) {
  const photoFrame = manifestoPhoto.parentElement;
  const photoReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let photoFrameId = 0;
  const paintPhoto = () => {
    photoFrameId = 0;
    if (photoReduce) {
      manifestoPhoto.style.transform = "";
      return;
    }
    const rect = photoFrame.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = Math.min(1, Math.max(0, (innerHeight * 0.92 - rect.top) / (rect.height + innerHeight * 0.5)));
    const scale = 1.3 - 0.3 * progress;
    const shift = (0.5 - progress) * 8;
    manifestoPhoto.style.transform = "translate3d(0, " + shift.toFixed(2) + "%, 0) scale(" + scale.toFixed(4) + ")";
  };
  onScrollFrame(paintPhoto);
  paintPhoto();
}
