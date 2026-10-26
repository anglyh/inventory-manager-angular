import { Component, input } from '@angular/core';

/** Estado de la caja: abierta en verde con un punto que late; cerrada en neutro. */
@Component({
  selector: 'cash-status-pill',
  host: { class: 'contents' },
  template: `
    <span
      class="badge badge-sm w-fit gap-1.5 whitespace-nowrap border-0 font-medium"
      [class]="open() ? 'bg-success-soft text-success' : 'bg-base-200 text-neutral'"
    >
      <span class="relative flex size-2" aria-hidden="true">
        @if (open()) {
          <span class="absolute inline-flex size-full rounded-full bg-success motion-safe:animate-ping"></span>
        }
        <span class="relative inline-flex size-2 rounded-full" [class]="open() ? 'bg-success' : 'bg-neutral'"></span>
      </span>
      {{ label() }}
    </span>
  `,
})
export class CashStatusPill {
  open = input(false);
  label = input.required<string>();
}
