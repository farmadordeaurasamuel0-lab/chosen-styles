/* ===== Letras animadas ao digitar =====
 * Visual apenas. O campo real continua recebendo o texto (leitores de tela e
 * validação não mudam). Um espelho, escondido de leitores de tela, mostra cada
 * letra digitada com uma pequena animação. Campos de senha não são espelhados.
 */
const LETTER_FIELD_SELECTOR = "#coupon-input, #search-input, #signup-form input[type=text], #signup-form input[type=email]";
const reduceLetters = matchMedia("(prefers-reduced-motion: reduce)").matches;

function attachLetterField(input) {
  if (input.dataset.letters) return;
  input.dataset.letters = "1";
  const wrap = document.createElement("span");
  wrap.className = "letter-wrap";
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  const mirror = document.createElement("span");
  mirror.className = "letter-mirror";
  mirror.setAttribute("aria-hidden", "true");
  wrap.appendChild(mirror);

  const copyStyle = () => {
    const cs = getComputedStyle(input);
    mirror.style.padding = cs.padding;
    mirror.style.fontFamily = cs.fontFamily;
    mirror.style.fontSize = cs.fontSize;
    mirror.style.letterSpacing = cs.letterSpacing;
    mirror.style.textTransform = cs.textTransform;
  };
  let previous = "";
  const render = () => {
    const value = input.value;
    let same = 0;
    while (same < previous.length && same < value.length && previous[same] === value[same]) same += 1;
    while (mirror.children.length > same) mirror.removeChild(mirror.lastChild);
    Array.from(value.slice(same)).forEach(char => {
      const letter = document.createElement("span");
      letter.className = "letter" + (reduceLetters ? "" : " is-new");
      letter.textContent = char === " " ? "\u00a0" : char;
      mirror.appendChild(letter);
    });
    mirror.style.transform = "translateX(" + (-input.scrollLeft) + "px)";
    previous = value;
  };
  copyStyle();
  render();
  input.addEventListener("input", render);
  input.addEventListener("scroll", () => { mirror.style.transform = "translateX(" + (-input.scrollLeft) + "px)"; });
  if (input.form) input.form.addEventListener("reset", () => setTimeout(() => { previous = ""; render(); }, 0));
  addEventListener("resize", copyStyle);
}

document.querySelectorAll(LETTER_FIELD_SELECTOR).forEach(attachLetterField);
