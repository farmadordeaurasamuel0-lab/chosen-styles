/* ===== Manifesto: transições de rolagem da foto =====
 * 1) Entrada: a foto sobe por baixo do bloco "Em breve" e cresce até ocupar a tela.
 * 2) Saída: ao descer a foto toda, ela se recolhe para cima.
 * Usa apenas transform e opacidade (compostos pela GPU), sem recorte por caminho a cada quadro.
 * Com movimento reduzido, a foto aparece inteira e parada.
 */
const expandFrame = document.getElementById("clip-media");
if (expandFrame) {
  const expandReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let expandId = 0;
  const paintExpand = () => {
    expandId = 0;
    if (expandReduce) {
      expandFrame.style.transform = "";
      expandFrame.style.opacity = "1";
      expandFrame.style.borderRadius = "0";
      return;
    }
    const rect = expandFrame.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight * 1.4) return;
    const enter = Math.min(1, Math.max(0, (innerHeight * 0.98 - rect.top) / (innerHeight * 0.7)));
    const leave = Math.min(1, Math.max(0, (innerHeight * 0.25 - rect.bottom) / (innerHeight * 0.45)));
    const scale = (0.86 + enter * 0.14) * (1 - leave * 0.04);
    const rise = (1 - enter) * 34;
    const sink = leave * 22;
    expandFrame.style.transform = "translate3d(0, " + (rise - sink).toFixed(2) + "vh, 0) scale(" + scale.toFixed(4) + ")";
    expandFrame.style.opacity = (1 - leave * 0.45).toFixed(3);
    expandFrame.style.borderRadius = ((1 - enter) * 16).toFixed(1) + "px";
  };
  onScrollFrame(paintExpand);
  paintExpand();
}
