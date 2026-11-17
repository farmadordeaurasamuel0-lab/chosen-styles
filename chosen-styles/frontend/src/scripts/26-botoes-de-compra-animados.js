/* ===== Botões de compra animados (letra por letra) =====
 * Visual apenas: não altera a regra de disponibilidade nem o carrinho.
 * O texto do botão é dividido em letras; ao passar o cursor, cada letra rola para
 * cima e revela uma cópia de si mesma, em sequência. Botões desabilitados não animam.
 */
const splitBuyLetters = button => {
  if (button.dataset.split) return;
  const label = button.textContent.trim();
  button.dataset.split = "1";
  button.setAttribute("aria-label", label);
  button.textContent = "";
  Array.from(label).forEach((char, index) => {
    const letter = document.createElement("span");
    letter.className = "buy-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.style.setProperty("--i", String(index));
    const glyph = document.createElement("span");
    glyph.className = "buy-char";
    glyph.dataset.char = char;
    glyph.textContent = char;
    letter.appendChild(glyph);
    button.appendChild(letter);
  });
};
const splitBuyButtons = root => root.querySelectorAll(".buy-btn").forEach(splitBuyLetters);
[$("grid"), $("pv-info")].forEach(root => {
  splitBuyButtons(root);
  new MutationObserver(() => splitBuyButtons(root)).observe(root, { childList: true, subtree: true });
});
