/* ===== Revelação ao entrar na tela ===== */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add("is-in");
      revealIO.unobserve(en.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => revealIO.observe(el));
const depthReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const depthFine = matchMedia("(hover: hover) and (pointer: fine)").matches;
function attachDepth(container) {
  if (depthReduce || !depthFine || !container || container.dataset.depth) return;
  container.dataset.depth = "1";
  container.classList.add("depth-on");
  const shine = document.createElement("span");
  shine.className = "depth-shine";
  shine.setAttribute("aria-hidden", "true");
  container.appendChild(shine);
  let frame = 0;
  let pending = null;
  const paint = () => {
    frame = 0;
    if (!pending) return;
    const rx = (0.5 - pending.py) * 8;
    const ry = (pending.px - 0.5) * 10;
    container.style.setProperty("--mx", (pending.px * 100).toFixed(1) + "%");
    container.style.setProperty("--my", (pending.py * 100).toFixed(1) + "%");
    if (container.classList.contains("is-zoomed")) return;
    container.querySelectorAll("img").forEach(img => {
      img.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) scale(1.03)";
    });
  };
  container.addEventListener("pointermove", e => {
    const r = container.getBoundingClientRect();
    pending = { px: (e.clientX - r.left) / r.width, py: (e.clientY - r.top) / r.height };
    if (!frame) frame = requestAnimationFrame(paint);
  });
  container.addEventListener("pointerleave", () => {
    container.querySelectorAll("img").forEach(img => { img.style.transform = ""; });
  });
}
renderGrid();
document.querySelectorAll(".product-media").forEach(attachDepth);
attachDepth($("pv-stage"));
const productGrid = new window.ProductGrid(grid, grid.querySelector(".empty-state"));
productGrid.apply(collectionFilter(activeCollection));
