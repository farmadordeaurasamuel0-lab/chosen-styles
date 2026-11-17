/* ===== Manifesto: os textos acendem palavra por palavra conforme a rolagem =====
 * Cada bloco marcado com data-scroll-words tem seu próprio progresso, ligado à sua
 * posição na tela (não ao tempo). Com movimento reduzido, tudo fica visível desde o início.
 */
const scrollWordsReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clampUnit = value => Math.min(1, Math.max(0, value));
const scrollWordBlocks = Array.from(document.querySelectorAll("[data-scroll-words]")).map(block => {
  const sourceText = block.textContent || "";
  block.textContent = "";
  const words = [];
  sourceText.split(" ").forEach((part, index) => {
    if (index > 0) block.appendChild(document.createTextNode(" "));
    if (!part) return;
    const word = document.createElement("span");
    word.className = "scroll-word";
    word.textContent = part;
    block.appendChild(word);
    words.push(word);
  });
  return { block, words, reached: 0 };
});
let scrollWordsFrame = 0;
const paintScrollWords = () => {
  scrollWordsFrame = 0;
  scrollWordBlocks.forEach(block => {
    const { words } = block;
    if (scrollWordsReduce) {
      words.forEach(word => { word.style.opacity = "1"; });
      return;
    }
    const rect = block.block.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    // Só acende: depois de lido, o texto não volta a ficar apagado.
    const progress = clampUnit((innerHeight * 0.92 - rect.top) / (innerHeight * 0.5));
    block.reached = Math.max(block.reached, progress);
    const span = words.length;
    words.forEach((word, index) => {
      const local = clampUnit(block.reached * span - index);
      word.style.opacity = (0.55 + local * 0.45).toFixed(3);
    });
  });
};
if (scrollWordBlocks.length) {
  onScrollFrame(paintScrollWords);
  paintScrollWords();
}
