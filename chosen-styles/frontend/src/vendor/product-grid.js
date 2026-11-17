/* Compilado de src/product-grid.ts (tsc --strict) */
"use strict";
/* Grade de produtos com reordenação FLIP.
 * Os cartões são criados uma vez e apenas ocultados/reordenados, para que
 * seus listeners (seleção de tamanho, adicionar ao carrinho) continuem válidos. */
const MOTION = {
    flip: { duration: 520, easing: "cubic-bezier(0.34, 1.3, 0.64, 1)" },
    enter: { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
};
function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
class ProductGrid {
    constructor(container, emptyEl) {
        this.container = container;
        this.emptyEl = emptyEl;
        this.cards = new Map();
        this.running = new Map();
        this.reduce = prefersReducedMotion();
        for (const child of Array.from(container.children)) {
            if (child instanceof HTMLElement && child.dataset.id) {
                this.cards.set(child.dataset.id, child);
            }
        }
    }
    /** Mostra apenas os cartões cujo id satisfaz o predicado e anima a reorganização. */
    apply(predicate) {
        const entries = Array.from(this.cards.entries());
        // Interrompe animações em andamento antes de medir as posições atuais.
        for (const [, el] of entries)
            this.cancel(el);
        const before = new Map();
        for (const [, el] of entries) {
            before.set(el, { rect: el.getBoundingClientRect(), wasHidden: Boolean(el.hidden) });
        }
        let visible = 0;
        for (const [id, el] of entries) {
            const show = predicate(id);
            el.hidden = !show;
            if (show)
                visible += 1;
        }
        // Reordena os visíveis na ordem original (mesma ordem do catálogo).
        for (const [, el] of entries) {
            if (!Boolean(el.hidden))
                this.container.appendChild(el);
        }
        this.emptyEl.hidden = visible !== 0;
        for (const [, el] of entries) {
            if (Boolean(el.hidden))
                continue;
            const prev = before.get(el);
            const next = el.getBoundingClientRect();
            if (this.reduce)
                continue;
            if (!prev || prev.wasHidden) {
                this.play(el, [
                    { opacity: 0, transform: "translateY(12px) scale(0.98)" },
                    { opacity: 1, transform: "none" },
                ], MOTION.enter);
                continue;
            }
            const dx = prev.rect.left - next.left;
            const dy = prev.rect.top - next.top;
            if (dx !== 0 || dy !== 0) {
                this.play(el, [
                    { transform: `translate(${dx}px, ${dy}px)` },
                    { transform: "none" },
                ], MOTION.flip);
            }
        }
        return visible;
    }
    play(el, frames, timing) {
        const animation = el.animate(frames, { duration: timing.duration, easing: timing.easing, fill: "none" });
        this.running.set(el, animation);
        animation.onfinish = () => {
            if (this.running.get(el) === animation)
                this.running.delete(el);
        };
    }
    cancel(el) {
        const animation = this.running.get(el);
        if (animation) {
            animation.cancel();
            this.running.delete(el);
        }
    }
}
window.ProductGrid = ProductGrid;
