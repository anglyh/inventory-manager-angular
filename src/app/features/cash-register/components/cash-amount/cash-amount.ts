import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

/**
 * Monto en soles con el entero como protagonista: "S/" y los céntimos van más chicos y en gris.
 * El tamaño del entero lo da el contenedor (`text-title`, `text-subtitle`...).
 */
@Component({
  selector: 'cash-amount',
  imports: [DecimalPipe],
  host: { class: 'whitespace-nowrap tabular-nums' },
  template: `@let text = (value() | number: '1.2-2') ?? '';<span class="text-body font-medium" [class]="minorClass()">S/ </span>{{ text.slice(0, -3) }}<span class="text-body" [class]="minorClass()">{{ text.slice(-3) }}</span>`,
})
export class CashAmount {
  /** Monto tal como llega de la API (string) o ya calculado. */
  value = input.required<string | number>();
  /** Sobre el fondo oscuro (`bg-primary`) el gris tiene que ser claro. */
  inverse = input(false);

  readonly minorClass = computed(() => (this.inverse() ? 'text-base-300' : 'text-neutral'));
}
