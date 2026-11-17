/* ===== Ciclo único de rolagem =====
 * Em vez de cada efeito ouvir a rolagem por conta própria, todos se registram aqui.
 * A cada quadro, executa-se no máximo um ciclo: as leituras de posição e as escritas
 * de estilo de cada efeito acontecem em sequência, em um só passe, e o navegador
 * repinta a tela uma vez por quadro.
 */
const scrollPainters = [];
let scrollCycleId = 0;
const runScrollCycle = () => {
  scrollCycleId = 0;
  for (let index = 0; index < scrollPainters.length; index += 1) {
    scrollPainters[index]();
  }
};
const requestScrollCycle = () => {
  if (!scrollCycleId) scrollCycleId = requestAnimationFrame(runScrollCycle);
};
const onScrollFrame = paint => { scrollPainters.push(paint); };
addEventListener("scroll", requestScrollCycle, { passive: true });
addEventListener("resize", requestScrollCycle);
