import { afterNextRender, ElementRef, inject, Injector } from '@angular/core';

const FLASH_COLOR = 'color-mix(in oklab, var(--color-success) 30%, var(--color-base-100))';

/**
 * Lleva a la vista y resalta un momento la fila con `data-row-key`, para mostrar
 * dónde cayó lo que se acaba de agregar. Se llama desde el contexto de inyección.
 */
export function injectRowFlash() {
  const host: HTMLElement = inject(ElementRef).nativeElement;
  const injector = inject(Injector);

  return (key: string) => {
    // La fila nueva recién existe después del próximo render.
    afterNextRender(() => {
      const row = host.querySelector<HTMLElement>(`[data-row-key="${CSS.escape(key)}"]`);
      if (!row) return;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      row.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
      row.animate([{ backgroundColor: FLASH_COLOR }, {}], { duration: 1000, easing: 'ease-out' });
    }, { injector });
  };
}
