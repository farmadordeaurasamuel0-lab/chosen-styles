/* ===== Voo do produto até o carrinho ===== */
function flyToCart(source, imageSrc) {
  const target = cartBtn.getBoundingClientRect();
  const from = source.getBoundingClientRect();
  const flyer = document.createElement("div");
  flyer.className = "flyer";
  if (imageSrc) {
    const thumb = document.createElement("img");
    thumb.src = imageSrc;
    thumb.alt = "";
    thumb.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
    flyer.appendChild(thumb);
  }
  Object.assign(flyer.style, {
    left: from.left + "px", top: from.top + "px",
    width: from.width + "px", height: from.height + "px"
  });
  document.body.appendChild(flyer);

  const dx = (target.left + target.width / 2) - (from.left + from.width / 2);
  const dy = (target.top + target.height / 2) - (from.top + from.height / 2);
  const scale = Math.min(1, 40 / Math.max(from.width, 1));

  const finish = () => {
    flyer.remove();
    const ring = document.createElement("div");
    ring.className = "ring";
    ring.style.left = (target.left + target.width / 2 - 22) + "px";
    ring.style.top = (target.top + target.height / 2 - 22) + "px";
    document.body.appendChild(ring);
    const r = ring.animate([{ transform: "scale(1)", opacity: 0.8 }, { transform: "scale(2.2)", opacity: 0 }], { duration: 500, easing: "ease-out" });
    r.onfinish = () => ring.remove();
    cartBtn.querySelector("#cart-count").animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
      { duration: 380, easing: "ease-out" }
    );
  };

  if (reduce) { finish(); return Promise.resolve(); }
  const anim = flyer.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${dx / 2 - 40}px, ${dy / 2 - 90}px) scale(${(1 + scale) / 2})`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 }
  ], { duration: 550, easing: "cubic-bezier(0.74, 0.18, 0.93, 0.69)", fill: "forwards" });
  return anim.finished.then(finish).catch(() => flyer.remove());
}
