/* ===== Manifesto: cada parágrafo aparece um depois do outro =====
 * Ao entrar na tela, os blocos do texto surgem em sequência, com um pequeno atraso
 * entre eles. A leitura por palavra (ao rolar) continua funcionando dentro de cada bloco.
 */
const sequenceText = document.querySelector(".manifesto-text");
if (sequenceText) {
  const sequenceReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sequenceItems = Array.from(sequenceText.children).filter(el => el.tagName === "P");
  if (sequenceReduce) {
    sequenceItems.forEach(el => { el.style.opacity = "1"; });
  } else {
    sequenceItems.forEach(el => { el.style.opacity = "0"; });
    const sequenceIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sequenceIO.unobserve(entry.target);
        sequenceItems.forEach((el, index) => {
          el.animate(
            [{ opacity: 0, transform: "translateY(26px)" }, { opacity: 1, transform: "none" }],
            { duration: 900, delay: index * 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" }
          );
        });
      });
    }, { threshold: 0.2 });
    sequenceIO.observe(sequenceText);
  }
}
