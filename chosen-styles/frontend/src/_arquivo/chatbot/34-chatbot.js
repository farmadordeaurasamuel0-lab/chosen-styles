/* ===== Assistente de dúvidas (regras, sem inteligência artificial externa) =====
 * Responde somente com informações confirmadas pela loja. Quando algo ainda não foi
 * definido (frete, parcelamento, medidas, material), o assistente diz isso e direciona
 * para a loja. Não promete prazos, descontos ou condições.
 */
const botEl = $("bot");
const botLog = $("bot-log");
const botChips = $("bot-chips");
const botForm = $("bot-form");
const botInput = $("bot-input");
const botToggle = $("bot-toggle");
const botReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const botBackdrop = $("bot-backdrop");
const botHandle = $("bot-handle");
const botSheet = matchMedia("(max-width: 600px)");

const normalizeBot = text => " " + String(text).toLowerCase().normalize("NFD").split("").filter(ch => {
  const code = ch.charCodeAt(0);
  return code < 768 || code > 879;
}).join("").replace(/[^a-z0-9]+/g, " ").trim() + " ";

const mailAction = { label: "Enviar e-mail", href: "mailto:chosenstyles.loja@gmail.com" };
const whatsAppActions = () => (CONTACT.whatsapp ? [{ label: "Falar no WhatsApp", href: "https://wa.me/" + CONTACT.whatsapp }] : []);

const BOT_KB = [
  { id: "inicio", keys: ["oi", "ola", "bom dia", "boa tarde", "boa noite", "eae", "hey"], text: "Oi! Sou o assistente da Chosen Styles. Posso ajudar com produtos, tamanhos, compra, pagamento, trocas e contato. O que você quer saber?", chips: ["produtos", "compra", "pagamento", "trocas", "contato"] },
  { id: "ajuda", keys: ["ajuda", "opcoes", "menu", "o que voce faz", "pode fazer", "assuntos"], text: "Posso responder sobre: produtos e preços, tamanhos, como comprar, pagamento, frete, trocas e reembolso, material, conta, cupons e contato. Escolha um assunto ou digite sua dúvida.", chips: ["produtos", "tamanhos", "compra", "frete", "contato"] },
  { id: "produtos", keys: ["produto", "produtos", "camiseta", "camisetas", "peca", "pecas", "modelo", "estampa", "colecao", "off white", "black", "essential"], text: "Hoje temos duas camisetas da linha CRISTÃ Essential: Off-White e Black. Toque na foto de uma peça para ver a frente, o verso e as especificações.", chips: ["preco", "tamanhos", "compra", "proxima"], actions: () => [{ label: "Ver as camisetas", href: "#colecao" }] },
  { id: "preco", keys: ["preco", "precos", "valor", "quanto custa", "quanto e", "reais", "r$", "custa", "barato", "caro"], text: "As duas camisetas atuais custam R$ 140,00 cada. No momento não há promoção cadastrada.", chips: ["cupons", "compra", "produtos"] },
  { id: "tamanhos", keys: ["tamanho", "tamanhos", "medida", "medidas", "tabela", "gg", "p m g", "numeracao", "caimento", "veste"], text: "Os tamanhos são P, M, G e GG. A tabela de medidas ainda não foi publicada pela loja. Se tiver dúvida sobre o caimento, fale com a loja.", chips: ["contato", "produtos", "compra"], actions: () => [mailAction, ...whatsAppActions()] },
  { id: "estoque", keys: ["estoque", "disponivel", "disponibilidade", "tem", "acabou", "esgotado", "quantidade", "sobrou"], text: "A disponibilidade de cada tamanho é confirmada pela loja antes do envio. Ao finalizar o pedido, a loja confirma o estoque com você.", chips: ["compra", "contato"] },
  { id: "compra", keys: ["comprar", "compra", "como compro", "como comprar", "finalizar", "pedido", "sacola", "carrinho", "adicionar", "comprar agora"], text: "Para comprar: escolha o tamanho, toque em Comprar agora (ou Adicionar à sacola), preencha seus dados, escolha Pix ou débito, revise o pedido e toque em Finalizar. Se o WhatsApp da loja estiver ligado no site, o pedido segue para lá. Se não estiver, o pedido fica só neste navegador, como teste.", chips: ["pagamento", "tamanhos", "contato"] },
  { id: "pagamento", keys: ["pagamento", "pagar", "pix", "debito", "cartao", "formas de pagamento", "como pago"], text: "Você pode escolher Pix ou cartão de débito. O site ainda não processa pagamentos: o combinado é feito com a loja pelo WhatsApp, na finalização. Nenhum valor é cobrado pelo site.", chips: ["parcelamento", "compra", "contato"] },
  { id: "parcelamento", keys: ["parcelar", "parcelamento", "parcela", "parcelas", "em quantas vezes", "12x"], text: "O parcelamento ainda não foi definido pela loja. Quando houver condições confirmadas, elas aparecem aqui.", chips: ["pagamento", "contato"] },
  { id: "frete", keys: ["frete", "entrega", "envio", "correio", "prazo", "chega", "transportadora", "entregam", "enviam"], text: "As condições de frete e o prazo de entrega ainda não foram definidos pela loja. Assim que forem divulgados, aparecem aqui.", chips: ["contato", "trocas"], actions: () => [mailAction, ...whatsAppActions()] },
  { id: "trocas", keys: ["troca", "trocar", "devolucao", "devolver", "reembolso", "desistir", "arrependimento", "estorno", "devolvo"], text: "Em compras pela internet, você pode desistir em até 7 dias após o recebimento, como prevê o Código de Defesa do Consumidor. As regras de troca e reembolso ainda estão sendo definidas pela loja.", chips: ["contato", "compra"], actions: () => [mailAction, ...whatsAppActions()] },
  { id: "material", keys: ["material", "tecido", "algodao", "composicao", "gramatura", "lavar", "cuidado", "cuidados", "lavagem", "passar"], text: "Os detalhes de material, composição e cuidados ainda não foram publicados pela loja. Assim que forem informados, aparecem na página de cada camiseta.", chips: ["produtos", "contato"] },
  { id: "conta", keys: ["conta", "cadastro", "cadastrar", "login", "entrar", "senha", "criar conta", "minha conta"], text: "Você pode criar uma conta tocando em Entrar, no topo. Por enquanto, a conta fica salva apenas neste navegador.", chips: ["compra", "contato"] },
  { id: "cupons", keys: ["cupom", "cupons", "desconto", "descontos", "promocao", "codigo", "voucher"], text: "Cupons ainda não estão disponíveis. Quando a loja liberar algum, basta digitar o código no campo do carrinho.", chips: ["preco", "compra"] },
  { id: "contato", keys: ["contato", "falar", "whatsapp", "instagram", "email", "e-mail", "atendimento", "telefone", "humano", "atendente", "loja"], text: "Você pode falar com a loja pelo e-mail chosenstyles.loja@gmail.com. O WhatsApp e o Instagram serão ativados assim que forem configurados.", chips: ["frete", "trocas", "produtos"], actions: () => [mailAction, ...whatsAppActions()] },
  { id: "marca", keys: ["marca", "historia", "sobre", "cristao", "fe", "proposito", "identidade", "quem e"], text: "A Chosen Styles une estilo urbano e uma mensagem de fé. O texto completo sobre a marca ainda está em revisão.", chips: ["produtos", "contato"] },
  { id: "proxima", keys: ["proxima", "nova peca", "lancamento", "breve", "quando", "novidade", "novidades"], text: "A próxima peça está em preparação. A previsão é 10 de novembro de 2026, e os detalhes serão divulgados antes do lançamento.", chips: ["produtos", "contato"] },
  { id: "curtir", keys: ["curtir", "curtida", "coracao", "favorito", "favoritos"], text: "Toque no coração na foto de uma peça para curtir. As curtidas ficam salvas neste navegador.", chips: ["produtos"] },
  { id: "busca", keys: ["buscar", "busca", "pesquisa", "pesquisar", "procurar", "lupa"], text: "Toque na lupa no topo da página para buscar uma peça pelo nome.", chips: ["produtos"] },
  { id: "obrigado", keys: ["obrigado", "obrigada", "valeu", "thanks", "legal", "beleza", "show"], text: "De nada! Se precisar de mais alguma coisa, é só perguntar.", chips: ["ajuda"] },
  { id: "tchau", keys: ["tchau", "ate logo", "flw", "adeus", "ate mais"], text: "Até logo! Volte quando quiser. Você pode fechar esta janela tocando em Fechar.", chips: [] },
  { id: "padrao", keys: [], text: "Não entendi bem. Tente outra palavra ou escolha um assunto abaixo.", chips: ["produtos", "compra", "pagamento", "trocas", "contato"] }
];
const CHIP_LABELS = { produtos: "Produtos", tamanhos: "Tamanhos", compra: "Como comprar", pagamento: "Pagamento", parcelamento: "Parcelamento", frete: "Frete", trocas: "Trocas", contato: "Contato", preco: "Preço", cupons: "Cupons", proxima: "Próxima peça", material: "Material", conta: "Minha conta", ajuda: "Ajuda" };
const findIntent = id => BOT_KB.find(entry => entry.id === id) || BOT_KB[BOT_KB.length - 1];

function bestIntentFor(text) {
  const haystack = normalizeBot(text);
  let best = null;
  let bestScore = 0;
  BOT_KB.forEach(entry => {
    if (!entry.keys.length) return;
    const score = entry.keys.reduce((total, key) => total + (haystack.indexOf(normalizeBot(key)) !== -1 ? 1 : 0), 0);
    if (score > bestScore) { best = entry; bestScore = score; }
  });
  return best ? best.id : "padrao";
}

function addBotMessage(role, text, actions) {
  const message = document.createElement("div");
  message.className = "bot-msg " + role;
  const bubble = document.createElement("p");
  if (role.indexOf("bot") === 0 && role.indexOf("typing") === -1 && !botReduce) {
    // Cada palavra surge em sequência, como o restante do site
    text.split(" ").forEach((word, index) => {
      if (index > 0) bubble.appendChild(document.createTextNode(" "));
      const span = document.createElement("span");
      span.className = "bw";
      span.style.setProperty("--i", String(index));
      span.textContent = word;
      bubble.appendChild(span);
    });
  } else {
    bubble.textContent = text;
  }
  message.appendChild(bubble);
  if (actions && actions.length) {
    const row = document.createElement("div");
    row.className = "bot-actions";
    actions.forEach((action, index) => {
      const link = document.createElement("a");
      link.className = "bot-action";
      link.href = action.href;
      link.textContent = action.label;
      link.style.setProperty("--i", String(index));
      if (action.href.indexOf("http") === 0) { link.target = "_blank"; link.rel = "noopener"; }
      row.appendChild(link);
    });
    message.appendChild(row);
  }
  botLog.appendChild(message);
  botLog.scrollTop = botLog.scrollHeight;
  return message;
}

function showChips(ids) {
  botChips.innerHTML = "";
  ids.forEach(id => {
    if (!CHIP_LABELS[id]) return;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "bot-chip";
    chip.dataset.intent = id;
    chip.textContent = CHIP_LABELS[id];
    botChips.appendChild(chip);
  });
}

function answerIntent(intentId, userLabel) {
  if (userLabel) addBotMessage("user", userLabel);
  const entry = findIntent(intentId);
  const typing = addBotMessage("bot typing", "");
  const dots = document.createElement("span");
  dots.className = "bot-dots";
  dots.setAttribute("aria-label", "Assistente digitando");
  dots.innerHTML = "<i></i><i></i><i></i>";
  typing.querySelector("p").appendChild(dots);
  const reply = () => {
    typing.remove();
    const actions = entry.actions ? entry.actions() : [];
    addBotMessage("bot", entry.text, actions);
    showChips(entry.chips);
  };
  if (botReduce) reply(); else setTimeout(reply, 520);
}

let botCloseTimer = 0;
function openBot() {
  clearTimeout(botCloseTimer);
  botEl.classList.remove("is-closing");
  botEl.hidden = false;
  botBackdrop.hidden = false;
  botEl.classList.add("is-open");
  botToggle.setAttribute("aria-expanded", "true");
  if (!botLog.childElementCount) answerIntent("inicio");
  botInput.focus();
}
function closeBot() {
  if (botEl.hidden) return;
  botToggle.setAttribute("aria-expanded", "false");
  botBackdrop.hidden = true;
  botEl.style.removeProperty("--bot-b");
  botEl.style.removeProperty("--bot-h");
  botEl.style.transform = "";
  botEl.style.transition = "";
  botEl.classList.remove("is-open");
  clearTimeout(botCloseTimer);
  if (botReduce) {
    botEl.hidden = true;
    botEl.classList.remove("is-closing");
  } else {
    botEl.classList.add("is-closing");
    // Oculta ao fim da animação de saída, com prazo fixo: nunca fica aberto por falta de evento
    botCloseTimer = setTimeout(() => {
      botEl.hidden = true;
      botEl.classList.remove("is-closing");
    }, 320);
  }
  botToggle.focus();
}

botToggle.addEventListener("click", () => { if (botEl.hidden) openBot(); else closeBot(); });
$("bot-close").addEventListener("click", closeBot);
botForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = botInput.value.trim();
  if (!text) return;
  botInput.value = "";
  answerIntent(bestIntentFor(text), text);
});
botChips.addEventListener("click", e => {
  const chip = e.target.closest("[data-intent]");
  if (!chip) return;
  answerIntent(chip.dataset.intent, chip.textContent);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !botEl.hidden) closeBot();
});

botBackdrop.addEventListener("click", closeBot);
let sheetDragStart = null;
let sheetDragY = 0;
botHandle.addEventListener("pointerdown", e => {
  if (!botSheet.matches) return;
  sheetDragStart = e.clientY;
  sheetDragY = 0;
  botEl.style.transition = "none";
  botHandle.setPointerCapture(e.pointerId);
});
botHandle.addEventListener("pointermove", e => {
  if (sheetDragStart === null) return;
  sheetDragY = Math.max(0, e.clientY - sheetDragStart);
  botEl.style.transform = "translateY(" + sheetDragY + "px)";
});
const endSheetDrag = () => {
  if (sheetDragStart === null) return;
  sheetDragStart = null;
  botEl.style.transition = "";
  if (sheetDragY > 110) {
    botEl.style.transform = "";
    closeBot();
  } else {
    botEl.style.transform = "";
  }
};
botHandle.addEventListener("pointerup", endSheetDrag);
botHandle.addEventListener("pointercancel", endSheetDrag);

/* Celular com teclado aberto: a folha sobe junto com a área visível, e o campo continua à vista */
const syncBotToKeyboard = () => {
  if (!botSheet.matches || botEl.hidden) return;
  const vv = window.visualViewport;
  if (!vv) return;
  const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  botEl.style.setProperty("--bot-b", covered + "px");
  botEl.style.setProperty("--bot-h", Math.min(vv.height * 0.84, 720) + "px");
  botLog.scrollTop = botLog.scrollHeight;
};
const resetBotSheet = () => {
  botEl.style.removeProperty("--bot-b");
  botEl.style.removeProperty("--bot-h");
};
botInput.addEventListener("focus", () => {
  setTimeout(() => { botLog.scrollTop = botLog.scrollHeight; }, 300);
});
const botLogObserver = new MutationObserver(() => { botLog.scrollTop = botLog.scrollHeight; });
botLogObserver.observe(botLog, { childList: true, subtree: true });

/* Celular: ao digitar, a folha vai para a parte de cima da tela, e o campo fica acima do teclado,
 * independentemente do navegador. Ao sair do campo, ela volta para a base. */
let botTypingTimer = 0;
botInput.addEventListener("focus", () => {
  clearTimeout(botTypingTimer);
  if (botSheet.matches) botEl.classList.add("is-typing");
});
botInput.addEventListener("blur", () => {
  botTypingTimer = setTimeout(() => botEl.classList.remove("is-typing"), 150);
});
