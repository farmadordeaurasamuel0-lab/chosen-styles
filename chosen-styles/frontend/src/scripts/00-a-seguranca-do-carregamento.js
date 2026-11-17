/* ===== Segurança do carregamento (executa antes de todo o restante) =====
 * 1) Armazenamento: o navegador ou a janela de visualização pode bloquear localStorage e sessionStorage,
 *    e o acesso a eles gera erro. Aqui nenhum acesso lança erro: sem armazenamento, o site segue
 *    funcionando, e a sessão fica só na memória desta aba.
 * 2) Rede de segurança: se algum erro interromper o restante do script, a tela de carregamento e a
 *    abertura são liberadas depois de 8 segundos, para o visitante nunca ficar preso na entrada.
 */
const safeStorage = (() => {
  const engineOf = (name) => {
    try { return window[name] || null; } catch { return null; }
  };
  const create = (name, keepInMemory) => {
    const engine = engineOf(name);
    const memory = new Map();
    return {
      get(key) {
        try {
          const value = engine ? engine.getItem(key) : null;
          if (value !== null) return value;
        } catch { /* bloqueado: usa a memória desta aba */ }
        return keepInMemory && memory.has(key) ? memory.get(key) : null;
      },
      // Retorna true somente se o valor foi gravado no navegador.
      put(key, value) {
        const text = String(value);
        if (keepInMemory) memory.set(key, text);
        try {
          if (!engine) return false;
          engine.setItem(key, text);
          return true;
        } catch { return false; }
      },
      remove(key) {
        memory.delete(key);
        try { if (engine) engine.removeItem(key); } catch { /* bloqueado */ }
      },
    };
  };
  return { local: create("localStorage", false), session: create("sessionStorage", true) };
})();

setTimeout(() => {
  const loader = document.getElementById("loader");
  if (loader) loader.remove();
  document.documentElement.classList.remove("is-loading", "intro-pending");
  const intro = document.getElementById("intro");
  if (intro) intro.remove();
  document.querySelectorAll(".intro-curtain").forEach(c => c.remove());
  document.body.classList.add("hero-enter", "hero-ready");
}, 8000);
