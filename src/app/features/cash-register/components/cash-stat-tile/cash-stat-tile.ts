import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerArrowsExchange, tablerBed, tablerCash, tablerClock, tablerDeviceMobile, tablerReceipt } from '@ng-icons/tabler-icons';

export type StatTileTone = 'primary' | 'success' | 'info' | 'warning' | 'neutral';

/** Literales completos para que Tailwind los detecte. */
const TONE_CLASS: Record<StatTileTone, string> = {
  primary: 'bg-primary text-primary-content',
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  neutral: 'bg-base-200 text-neutral',
};

/** Métrica corta: ícono de color, etiqueta, valor (contenido proyectado) y una pista opcional. */
@Component({
  selector: 'cash-stat-tile',
  imports: [NgIcon],
  viewProviders: [
    provideIcons({ tablerArrowsExchange, tablerBed, tablerCash, tablerClock, tablerDeviceMobile, tablerReceipt }),
  ],
  host: { class: 'block min-w-0' },
  templateUrl: './cash-stat-tile.html',
})
export class CashStatTile {
  label = input.required<string>();
  icon = input.required<string>();
  tone = input<StatTileTone>('neutral');
  hint = input<string | null>(null);

  readonly toneClass = computed(() => TONE_CLASS[this.tone()]);
}
