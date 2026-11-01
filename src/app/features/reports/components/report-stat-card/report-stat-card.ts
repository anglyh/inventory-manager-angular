import { Component, computed, input } from '@angular/core';

type StatFormat = 'money' | 'number' | 'percent';
type StatSize = 'hero' | 'md' | 'sm';
type StatTone = 'primary' | 'default' | 'danger';

const NUMBER = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const INTEGER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const VALUE_SIZE: Record<StatSize, string> = {
  hero: 'text-3xl md:text-4xl xl:text-3xl 2xl:text-4xl',
  md: 'text-xl 2xl:text-2xl',
  sm: 'text-xl sm:text-2xl',
};

/** Métrica con el componente `stat` de daisyUI: el número es el protagonista. */
@Component({
  selector: 'report-stat-card',
  templateUrl: './report-stat-card.html',
  styles: `
    :host { display: block; }
    .stats { animation: stat-in 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both; }
    @keyframes stat-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) { .stats { animation: none; } }
  `,
})
export class ReportStatCard {
  label = input.required<string>();
  /** Valor numérico tal como llega de la API (string) o ya calculado. */
  value = input.required<string | number>();
  format = input<StatFormat>('money');
  size = input<StatSize>('sm');
  tone = input<StatTone>('default');
  /** Variación % contra el período anterior; null oculta el indicador. */
  delta = input<number | null>(null);
  /** Para pérdidas: subir es malo. */
  invertDelta = input(false);
  hint = input<string | null>(null);
  /** Qué significa la cifra, en palabras simples: va en el `title` de la card. */
  explanation = input<string | null>(null);
  /** Retraso de la animación de entrada (ms), para escalonar las cards. */
  delay = input(0);

  readonly valueSize = computed(() => VALUE_SIZE[this.size()]);
  readonly isPrimary = computed(() => this.tone() === 'primary');

  /** Entero y decimales por separado: los centavos se muestran más chicos. */
  readonly parts = computed(() => {
    const raw = Number(this.value());
    const value = Math.abs(raw);
    const negative = raw < 0;
    if (this.format() !== 'money') return { negative, int: INTEGER.format(value), dec: null };
    const [int, dec] = NUMBER.format(value).split('.');
    return { negative, int: int!, dec: dec! };
  });

  readonly deltaView = computed(() => {
    const delta = this.delta();
    if (delta === null || !Number.isFinite(delta)) return null;
    const good = this.invertDelta() ? delta <= 0 : delta >= 0;
    return { arrow: delta >= 0 ? '↑' : '↓', text: `${INTEGER.format(Math.abs(delta))}%`, good };
  });
}
