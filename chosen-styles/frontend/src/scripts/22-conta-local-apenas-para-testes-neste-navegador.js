/* ===== Conta local (apenas para testes neste navegador) ===== */
const ACC_USERS_KEY = "cs:users";
const ACC_SESSION_KEY = "cs:session";
const ACC_LOCK_KEY = "cs:lock";
const ACC_MAX_FAILS = 5;
const ACC_LOCK_MS = 60000;
const textEnc = new TextEncoder();
const toB64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const isEmail = v => {
  const at = v.indexOf("@");
  return at > 0 && v.indexOf("@", at + 1) === -1 && v.indexOf(".", at) > at + 1 && v.lastIndexOf(".") < v.length - 2 && v.indexOf(" ") === -1;
};
const normEmail = v => v.trim().toLowerCase();
const accReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function enterChildren(container) {
  if (accReduce) return;
  Array.from(container.children).forEach((el, i) => {
    el.animate(
      [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
      { duration: 450, delay: 60 + i * 60, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" }
    );
  });
}
function shakeOnError(errorEl, formEl) {
  if (accReduce) return;
  new MutationObserver(() => {
    if (errorEl.textContent) {
      formEl.animate(
        [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(3px)" }, { transform: "none" }],
        { duration: 420, easing: "ease-out" }
      );
    }
  }).observe(errorEl, { childList: true, characterData: true, subtree: true });
}
shakeOnError($("acc-login-error"), $("acc-login"));
shakeOnError($("acc-signup-error"), $("acc-signup"));

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", textEnc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" }, key, 256);
  return new Uint8Array(bits);
}
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
function readUsers() {
  try {
    const list = JSON.parse(safeStorage.local.get(ACC_USERS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}
function writeUsers(list) {
  return safeStorage.local.put(ACC_USERS_KEY, JSON.stringify(list));
}
function readLock() {
  try { return JSON.parse(safeStorage.local.get(ACC_LOCK_KEY) || "{}"); }
  catch { return {}; }
}
function writeLock(lock) {
  safeStorage.local.put(ACC_LOCK_KEY, JSON.stringify(lock));
}

let accUser = null;

// Compras enviadas por este navegador com o mesmo e-mail da conta
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function renderMyOrders() {
  const box = $("acc-orders");
  if (!box) return;
  box.textContent = "";
  if (!accUser) return;
  const mine = readOrders().filter(o => o.email === normEmail(accUser.email));
  const title = document.createElement("p");
  title.className = "acc-orders-title";
  title.textContent = "Minhas compras";
  box.appendChild(title);
  if (!mine.length) {
    const none = document.createElement("p");
    none.className = "acc-orders-empty";
    none.textContent = "Você ainda não tem compras enviadas por este navegador.";
    box.appendChild(none);
    return;
  }
  mine.forEach(order => {
    const card = document.createElement("article");
    card.className = "acc-order";
    const head = document.createElement("div");
    head.className = "acc-order-head";
    const status = document.createElement("span");
    status.className = "acc-order-status";
    status.innerHTML = CHECK_ICON;
    const label = document.createElement("span");
    label.textContent = "Compra enviada com sucesso";
    status.appendChild(label);
    const total = document.createElement("strong");
    total.textContent = fmt(order.total);
    head.append(status, total);
    const items = document.createElement("p");
    items.className = "acc-order-items";
    items.textContent = order.items.map(i => i.name + " · tamanho " + i.size + " × " + i.qty).join(" · ");
    const meta = document.createElement("small");
    meta.textContent = order.id + " · " + new Date(order.createdAt).toLocaleString("pt-BR") + " · " + order.payment + ". Aguardando confirmação do pagamento pela loja.";
    card.append(head, items, meta);
    box.appendChild(card);
  });
}
window.addEventListener("cs:orders-changed", renderMyOrders);
function setAccountUI() {
  const btn = $("acc-btn");
  const loggedIn = accUser !== null;
  btn.setAttribute("aria-label", loggedIn ? "Minha conta: " + accUser.name : "Entrar");
  $("acc-login").hidden = loggedIn;
  $("acc-signup").hidden = loggedIn;
  $("acc-session").hidden = !loggedIn;
  $("acc-name").textContent = loggedIn ? accUser.name : "";
  document.querySelector(".acc-tabs").hidden = loggedIn;
  if (loggedIn) enterChildren($("acc-session"));
  renderMyOrders();
}
function restoreSession() {
  const email = safeStorage.session.get(ACC_SESSION_KEY);
  const user = email ? readUsers().find(u => u.email === email) : undefined;
  accUser = user ? { email: user.email, name: user.name } : null;
  setAccountUI();
}

const accWordsReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function splitWordsDeep(root) {
  if (root.dataset.wordsSplit) return;
  root.dataset.wordsSplit = "1";
  const walk = node => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === 3) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(" ").forEach((part, index) => {
          if (index > 0) fragment.appendChild(document.createTextNode(" "));
          if (!part) return;
          const wrap = document.createElement("span");
          wrap.className = "split-word";
          const inner = document.createElement("span");
          inner.textContent = part;
          wrap.appendChild(inner);
          fragment.appendChild(wrap);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === 1 && child.tagName !== "INPUT" && child.tagName !== "SVG" && child.tagName !== "BUTTON") {
        walk(child);
      }
    });
  };
  walk(root);
}
function playAccountWords(root, delayBase) {
  if (accWordsReduce) return;
  splitWordsDeep(root);
  root.querySelectorAll(".split-word > span").forEach((node, index) => {
    node.animate(
      [{ transform: "translateY(120%)" }, { transform: "translateY(0%)" }],
      { duration: 700, delay: delayBase + index * 40, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" }
    );
  });
}
function animateAccountHead() {
  ["acc-eyebrow", "acc-title", "acc-sub"].forEach((cls, index) => {
    const el = document.querySelector("." + cls) || $(cls);
    if (el) playAccountWords(el, 60 + index * 160);
  });
  document.querySelectorAll(".acc-tabs .ctab").forEach(tab => playAccountWords(tab, 240));
}

function showAccountTab(target) {
  document.querySelectorAll("[data-acc]").forEach(t => t.setAttribute("aria-selected", String(t.dataset.acc === target)));
  const shown = target === "login" ? $("acc-login") : $("acc-signup");
  const hidden = target === "login" ? $("acc-signup") : $("acc-login");
  hidden.hidden = true;
  shown.hidden = false;
  enterChildren(shown);
  shown.querySelectorAll("label").forEach(label => playAccountWords(label, 260));
}
document.querySelectorAll("[data-acc]").forEach(tab => tab.addEventListener("click", () => showAccountTab(tab.dataset.acc)));
$("acc-btn").addEventListener("click", () => {
  showAccountTab("login");
  $("acc").showModal();
  animateAccountHead();
  if (!accUser) $("acc-login").email.focus();
});
$("acc-close").addEventListener("click", () => $("acc").close());
$("acc").addEventListener("click", e => { if (e.target === $("acc")) $("acc").close(); });
$("acc-logout").addEventListener("click", () => {
  safeStorage.session.remove(ACC_SESSION_KEY);
  restoreSession();
});

let loginBusy = false;
function setSubmitLoading(button, loading) {
  button.disabled = loading;
  button.classList.toggle("is-loading", loading);
  if (loading) button.setAttribute("aria-busy", "true");
  else button.removeAttribute("aria-busy");
}
async function attemptLogin(form) {
  const email = normEmail(form.email.value);
  const password = form.password.value;
  const lock = readLock();
  if (lock.until && lock.until > Date.now()) {
    return "Muitas tentativas. Aguarde " + Math.ceil((lock.until - Date.now()) / 1000) + " segundos.";
  }
  const user = readUsers().find(u => u.email === email);
  const salt = user ? fromB64(user.salt) : new Uint8Array(16);
  const hash = await hashPassword(password, salt);
  const ok = user !== undefined && sameBytes(hash, fromB64(user.hash));
  if (!ok) {
    const fails = (lock.fails || 0) + 1;
    writeLock(fails >= ACC_MAX_FAILS ? { fails: 0, until: Date.now() + ACC_LOCK_MS } : { fails, until: 0 });
    return "Não foi possível entrar. Verifique o e-mail e a senha.";
  }
  writeLock({});
  safeStorage.session.put(ACC_SESSION_KEY, user.email);
  form.reset();
  restoreSession();
  $("acc").close();
  return "";
}
$("acc-login").addEventListener("submit", async e => {
  e.preventDefault();
  if (loginBusy) return;
  const form = e.currentTarget;
  const error = $("acc-login-error");
  const button = form.querySelector(".btn-submit");
  error.textContent = "";
  loginBusy = true;
  setSubmitLoading(button, true);
  try {
    error.textContent = await attemptLogin(form);
  } finally {
    loginBusy = false;
    setSubmitLoading(button, false);
  }
});

$("acc-signup").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const error = $("acc-signup-error");
  error.textContent = "";
  const name = form.fullname.value.trim();
  const email = normEmail(form.email.value);
  const password = form.password.value;
  if (name.length < 2 || name.length > 80) { error.textContent = "Informe seu nome."; return; }
  if (!isEmail(email)) { error.textContent = "Informe um e-mail válido."; return; }
  if (password.length < 8 || password.length > 128) { error.textContent = "A senha deve ter entre 8 e 128 caracteres."; return; }
  const users = readUsers();
  if (users.some(u => u.email === email)) {
    error.textContent = "Não foi possível criar a conta com estes dados.";
    return;
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  users.push({ email, name, salt: toB64(salt), hash: toB64(hash) });
  if (!writeUsers(users)) {
    error.textContent = "Não foi possível salvar a conta neste navegador.";
    return;
  }
  safeStorage.session.put(ACC_SESSION_KEY, email);
  form.reset();
  restoreSession();
  $("acc").close();
});

restoreSession();
