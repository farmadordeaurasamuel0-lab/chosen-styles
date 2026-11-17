/* ===== Subida com giro do bloco Sobre ===== */
const liftBlock = document.querySelector(".lift");
if (liftBlock && !splitHeadingReduce) {
  const liftIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      liftIO.unobserve(en.target);
      en.target.animate(
        [
          { opacity: 0, transform: "translateY(160px) rotate(-8deg)" },
          { opacity: 1, transform: "translateY(0px) rotate(0deg)" }
        ],
        { duration: 900, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)", fill: "both" }
      );
    });
  }, { threshold: 0.25 });
  liftIO.observe(liftBlock);
} else if (liftBlock) {
  liftBlock.classList.remove("lift");
}
