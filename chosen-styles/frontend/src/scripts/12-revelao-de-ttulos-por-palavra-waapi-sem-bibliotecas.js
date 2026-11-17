/* ===== Revelação de títulos por palavra (WAAPI, sem bibliotecas) ===== */
const splitHeadingReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const splitHeadings = Array.from(document.querySelectorAll(".split-heading"));
splitHeadings.forEach(heading => {
  const text = heading.textContent || "";
  heading.textContent = "";
  text.split(" ").forEach((part, idx) => {
    if (idx > 0) heading.appendChild(document.createTextNode(" "));
    if (part === "") return;
    const wrap = document.createElement("span");
    wrap.className = "split-word";
    const inner = document.createElement("span");
    inner.textContent = part;
    wrap.appendChild(inner);
    heading.appendChild(wrap);
  });
});
const playSplitWords = heading => {
  const inners = Array.from(heading.querySelectorAll(".split-word > span"));
  if (splitHeadingReduce) return;
  inners.forEach((node, i) => {
    node.animate(
      [{ transform: "translateY(120%)" }, { transform: "translateY(0%)" }],
      { duration: 900, delay: i * 45, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" }
    );
  });
};
const splitIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    splitIO.unobserve(en.target);
    playSplitWords(en.target);
  });
}, { threshold: 0.4 });
splitHeadings.forEach(h => splitIO.observe(h));
