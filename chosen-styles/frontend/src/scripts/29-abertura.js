/* ===== Abertura inicial (transição de cortinas para a tela inicial) =====
 * Aparece uma vez por sessão do navegador. Ao terminar, ou ao tocar em "Pular" ou Escape,
 * duas cortinas douradas fecham a tela pelo meio e se abrem, revelando a tela inicial.
 * Com movimento reduzido ativado, a abertura não é exibida.
 */
const introEl = $("intro");
const introCurtains = Array.from(document.querySelectorAll(".intro-curtain"));
const introReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const introSeen = safeStorage.session.get("cs:intro-seen") === "1";
// Se algo falhar aqui, a tela inicial é liberada mesmo assim: a abertura nunca prende o visitante.
const releaseIntro = () => {
  document.documentElement.classList.remove("intro-pending");
  if (introEl) introEl.remove();
  introCurtains.forEach(c => c.remove());
};
try {
  if (introEl && !introReduce && !introSeen) {
    safeStorage.session.put("cs:intro-seen", "1");
    let introLeaving = false;
    const finishIntro = () => {
      if (introLeaving) return;
      introLeaving = true;
      clearTimeout(introTimer);
      document.removeEventListener("keydown", onIntroKey);
      introEl.classList.add("is-leaving");
      // A tela inicial começa a aparecer no instante em que as cortinas começam a se abrir
      setTimeout(() => {
        document.documentElement.classList.remove("intro-pending");
        document.body.classList.add("hero-enter");
      }, 780);
      setTimeout(() => document.body.classList.add("hero-ready"), 2400);
      setTimeout(() => {
        introEl.remove();
        introCurtains.forEach(c => c.remove());
      }, 1900);
    };
    const onIntroKey = e => { if (e.key === "Escape") finishIntro(); };
    const introTimer = setTimeout(finishIntro, 4500);
    $("intro-skip").addEventListener("click", finishIntro);
    document.addEventListener("keydown", onIntroKey);
  } else if (introEl) {
    releaseIntro();
  }
} catch {
  releaseIntro();
}
