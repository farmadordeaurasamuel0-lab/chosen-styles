/* Grade de produtos com reordenação FLIP.
 * Os cartões são criados uma vez e apenas ocultados/reordenados, para que
 * seus listeners (seleção de tamanho, adicionar ao carrinho) continuem válidos. */

interface MotionTiming {
  readonly duration: number;
  readonly easing: string;
}

const MOTION = {
  flip: { duration: 520, easing: "cubic-bezier(0.34, 1.3, 0.64, 1)" } as MotionTiming,
  enter: { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" } as MotionTiming,
} as const;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

class ProductGrid {
  private readonly cards: Map<string, HTMLElement> = new Map();
  private readonly running: Map<HTMLElement, Animation> = new Map();
  private readonly reduce: boolean;

  constructor(private readonly container: HTMLElement, private readonly emptyEl: HTMLElement) {
    this.reduce = prefersReducedMotion();
    for (const child of Array.from(container.children)) {
      if (child instanceof HTMLElement && child.dataset.id) {
        this.cards.set(child.dataset.id, child);
      }
    }
  }

  /** Mostra apenas os cartões cujo id satisfaz o predicado e anima a reorganização. */
  apply(predicate: (id: string) => boolean): number {
    const entries = Array.from(this.cards.entries());

    // Interrompe animações em andamento antes de medir as posições atuais.
    for (const [, el] of entries) this.cancel(el);

    const before = new Map<HTMLElement, { rect: DOMRect; wasHidden: boolean }>();
    for (const [, el] of entries) {
      before.set(el, { rect: el.getBoundingClientRect(), wasHidden: Boolean(el.hidden) });
    }

    let visible = 0;
    for (const [id, el] of entries) {
      const show = predicate(id);
      el.hidden = !show;
      if (show) visible += 1;
    }

    // Reordena os visíveis na ordem original (mesma ordem do catálogo).
    for (const [, el] of entries) {
      if (!Boolean(el.hidden)) this.container.appendChild(el);
    }
    this.emptyEl.hidden = visible !== 0;

    for (const [, el] of entries) {
      if (Boolean(el.hidden)) continue;
      const prev = before.get(el);
      const next = el.getBoundingClientRect();
      if (this.reduce) continue;

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

  private play(el: HTMLElement, frames: Keyframe[], timing: MotionTiming): void {
    const animation = el.animate(frames, { duration: timing.duration, easing: timing.easing, fill: "none" });
    this.running.set(el, animation);
    animation.onfinish = () => {
      if (this.running.get(el) === animation) this.running.delete(el);
    };
  }

  private cancel(el: HTMLElement): void {
    const animation = this.running.get(el);
    if (animation) {
      animation.cancel();
      this.running.delete(el);
    }
  }
}

(window as unknown as { ProductGrid: typeof ProductGrid }).ProductGrid = ProductGrid;
