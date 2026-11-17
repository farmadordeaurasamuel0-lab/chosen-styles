/* ===== Scroll: cabeçalho, faixa e revelações ===== */
const bandStates = [];
const makeBandUnit = text => {
  const unit = document.createElement("span");
  unit.className = "band-unit";
  const solid = document.createElement("span");
  solid.className = "text-solid";
  solid.textContent = text;
  const outline = document.createElement("span");
  outline.className = "text-outline";
  outline.textContent = text;
  unit.appendChild(solid);
  unit.appendChild(outline);
  return unit;
};
function buildBand() {
  bandStates.length = 0;
  document.querySelectorAll(".band-line").forEach(line => {
    const text = line.dataset.text || "";
    line.innerHTML = "";
    const probe = makeBandUnit(text);
    line.appendChild(probe);
    const unitWidth = probe.offsetWidth || 1;
    line.innerHTML = "";
    const track = document.createElement("div");
    track.className = "band-track";
    const copies = Math.ceil(innerWidth / unitWidth) + 2;
    for (let i = 0; i < copies; i++) track.appendChild(makeBandUnit(text));
    line.appendChild(track);
    bandStates.push({
      track,
      unitWidth,
      reverse: line.dataset.reverse === "true",
      speed: Number(line.dataset.speed) || 0.3
    });
  });
}
const progressEl = $("progress");
const heroHeading = $("hero-heading");
let scrollFrame = 0;

const scrollTargets = { clip: [], text: [], scale: [] };
let cachedMaxScroll = 1;
let heroSectionEl = null;
let heroMediaEl = null;
let heroImgEl = null;
let lastBlurStep = -1;
const heroBlurEnabled = matchMedia("(pointer: fine)").matches;
function refreshScrollTargets() {
  scrollTargets.clip = Array.from(document.querySelectorAll("[data-clip]"));
  scrollTargets.text = Array.from(document.querySelectorAll("[data-scroll-text]"));
  scrollTargets.scale = Array.from(document.querySelectorAll("[data-scale-scroll]"));
  cachedMaxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  heroSectionEl = document.querySelector(".hero");
  heroMediaEl = document.querySelector(".hero-media");
  heroImgEl = document.querySelector(".hero-media img");
}
const progressFromRect = (rect, vh) => Math.min(1, Math.max(0, (vh - rect.top) / (vh / 2 + rect.height / 2)));

function onScroll() {
  scrollFrame = 0;
  onHeaderScroll();
  const vh = innerHeight;
  const y = scrollY;

  // Fase 1: somente leituras de layout
  const clipRectsP = scrollTargets.clip.map(el => progressFromRect(el.getBoundingClientRect(), vh));
  const textRectsP = scrollTargets.text.map(el => progressFromRect(el.getBoundingClientRect(), vh));
  const scaleRectsP = scrollTargets.scale.map(el => progressFromRect(el.getBoundingClientRect(), vh));

  // Fase 2: somente escritas de estilo
  progressEl.style.transform = "scaleX(" + Math.min(1, y / cachedMaxScroll).toFixed(4) + ")";
  if (!reduce) {
    bandStates.forEach(st => {
      const distance = y * st.speed;
      const m = ((distance % st.unitWidth) + st.unitWidth) % st.unitWidth;
      const x = st.reverse ? m - st.unitWidth : -m;
      st.track.style.transform = "translateX(" + x.toFixed(2) + "px)";
    });
    heroHeading.style.transform = "translateY(" + (y * 2) + "px)";
    if (heroImgEl) heroImgEl.style.translate = "0 " + (-y * 0.5).toFixed(2) + "px";
    if (heroSectionEl && heroMediaEl && heroBlurEnabled && y < vh * 1.2) {
      const heroP = Math.min(1, y / (vh * 0.45));
      heroMediaEl.style.transform = "scale(" + (1 - heroP * 0.12).toFixed(4) + ")";
      const step = Math.round(heroP * 4);
      if (step !== lastBlurStep) {
        heroMediaEl.style.filter = step > 0 ? "blur(" + (step * 2) + "px)" : "none";
        lastBlurStep = step;
      }
    }
    scrollTargets.clip.forEach((el, i) => {
      const side = (1 - clipRectsP[i]) * 50;
      el.style.clipPath = "inset(0 " + side.toFixed(2) + "% 0 " + side.toFixed(2) + "%)";
    });
    scrollTargets.text.forEach((el, i) => {
      el.style.opacity = (0.2 + 0.8 * textRectsP[i]).toFixed(3);
    });
    scrollTargets.scale.forEach((el, i) => {
      el.style.transform = "scale(" + (0.9 + 0.1 * scaleRectsP[i]).toFixed(4) + ")";
    });
  }
}
onScrollFrame(onScroll);
addEventListener("resize", () => { buildBand(); refreshScrollTargets(); });
