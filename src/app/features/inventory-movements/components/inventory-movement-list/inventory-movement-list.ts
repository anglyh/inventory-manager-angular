import { Component, computed, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerAlertTriangle,
  tablerArrowDownLeft,
  tablerArrowUpRight,
  tablerBan,
  tablerChevronDown,
} from '@ng-icons/tabler-icons';
import type { InventoryMovement } from '../../interfaces/inventory-movement.interface';
import { PAYMENT_LABELS, REASON_LABELS, movementTone, unitAmount } from '../../shared/movement-labels';

interface DayGroup {
  key: string;
  date: Date;
  movements: InventoryMovement[];
}

const TONE_ICON = {
  in: 'tablerArrowDownLeft',
  out: 'tablerArrowUpRight',
  loss: 'tablerAlertTriangle',
  voided: 'tablerBan',
} as const;

const TONE_CLASS = {
  in: 'bg-success/10 text-success',
  out: 'bg-info/10 text-info',
  loss: 'bg-error/10 text-error',
  voided: 'bg-base-200 text-neutral',
} as const;

/** Clave del día en hora local; `toISOString()` lo movería al día UTC. */
function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

@Component({
  selector: 'inventory-movement-list',
  imports: [DatePipe, DecimalPipe, NgIcon],
  viewProviders: [provideIcons({ tablerAlertTriangle, tablerArrowDownLeft, tablerArrowUpRight, tablerBan, tablerChevronDown })],
  templateUrl: './inventory-movement-list.html',
})
export class InventoryMovementList {
  movements = input.required<InventoryMovement[]>();
  voidRequested = output<InventoryMovement>();

  readonly reasonLabels = REASON_LABELS;
  readonly paymentLabels = PAYMENT_LABELS;
  readonly toneOf = movementTone;
  readonly toneClass = TONE_CLASS;
  readonly toneIcon = (movement: InventoryMovement) => TONE_ICON[movementTone(movement)];
  readonly unitAmount = unitAmount;

  groups = computed<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();

    for (const movement of this.movements()) {
      const date = new Date(movement.createdAt);
      const key = localDayKey(date);
      if (!groups.has(key)) {
        groups.set(key, { key, date: new Date(date.getFullYear(), date.getMonth(), date.getDate()), movements: [] });
      }
      groups.get(key)!.movements.push(movement);
    }

    return [...groups.values()];
  });

  dayLabel(date: Date): string | null {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (localDayKey(date) === localDayKey(today)) return 'Hoy';
    if (localDayKey(date) === localDayKey(yesterday)) return 'Ayer';
    return null;
  }

  isCurrentYear(date: Date): boolean {
    return date.getFullYear() === new Date().getFullYear();
  }

  productSummary(movement: InventoryMovement): string {
    const [first, second, ...rest] = movement.items.map(item => item.productName);
    const names = [first, second].filter(Boolean).join(', ');
    return rest.length ? `${names} +${rest.length}` : names;
  }

  detail(movement: InventoryMovement): string {
    const reason = REASON_LABELS[movement.reason];
    if (movement.paymentMethod) return `${reason} · ${PAYMENT_LABELS[movement.paymentMethod]}`;
    if (movement.supplierName) return `${reason} · ${movement.supplierName}`;
    return reason;
  }

  lineTotal(movement: InventoryMovement, item: InventoryMovement['items'][number]): number {
    return Number(unitAmount(movement, item)) * item.quantity;
  }
}
