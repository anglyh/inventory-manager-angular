import { Component, computed, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerAlertTriangle,
  tablerBan,
  tablerChevronDown,
  tablerClipboardCheck,
  tablerPackage,
  tablerShoppingCart,
  tablerTruck,
} from '@ng-icons/tabler-icons';
import type { InventoryMovement } from '../../interfaces/inventory-movement.interface';
import { KIND_VIEW, PAYMENT_LABELS, REASON_LABELS, movementKind, reasonKind, unitAmount } from '../../shared/movement-labels';
import { Button } from '@/shared/components/button/button';

interface DayGroup {
  key: string;
  date: Date;
  movements: InventoryMovement[];
}

/** Clave del día en hora local; `toISOString()` lo movería al día UTC. */
function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

@Component({
  selector: 'inventory-movement-list',
  imports: [DatePipe, DecimalPipe, NgIcon, Button],
  viewProviders: [
    provideIcons({
      tablerAlertTriangle,
      tablerBan,
      tablerChevronDown,
      tablerClipboardCheck,
      tablerPackage,
      tablerShoppingCart,
      tablerTruck,
    }),
  ],
  templateUrl: './inventory-movement-list.html',
})
export class InventoryMovementList {
  movements = input.required<InventoryMovement[]>();
  /** Solo ADMIN puede anular movimientos. */
  canVoid = input(true);
  voidRequested = output<InventoryMovement>();

  readonly reasonLabels = REASON_LABELS;
  readonly paymentLabels = PAYMENT_LABELS;
  readonly kindOf = movementKind;
  readonly kindView = KIND_VIEW;
  /** Efecto en el stock: "+24" entra, "−2" sale. */
  readonly signOf = (movement: InventoryMovement) => (movement.movementType === 'IN' ? '+' : '−');
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

  /** Hasta dos productos con su cantidad a la vista; el resto se resume como "+N". */
  summaryOf(movement: InventoryMovement): { shown: InventoryMovement['items']; rest: number } {
    return { shown: movement.items.slice(0, 2), rest: Math.max(movement.items.length - 2, 0) };
  }

  /** Lo que acompaña a la etiqueta del tipo: cómo pagó, a quién se compró o el motivo exacto. */
  detail(movement: InventoryMovement): string {
    if (movement.paymentMethod) return PAYMENT_LABELS[movement.paymentMethod];
    if (movement.supplierName) return movement.supplierName;
    // "Merma por daño" o "Faltante de conteo" dicen más que la etiqueta; "Stock inicial" la repetiría.
    const reason = REASON_LABELS[movement.reason];
    return reason === KIND_VIEW[reasonKind(movement.reason)].label ? '' : reason;
  }

  /** En una venta el monto es lo cobrado; en el resto, lo que costó la mercadería. */
  amountLabel(movement: InventoryMovement): string {
    return movement.reason === 'SALE' ? 'cobrado' : 'costo';
  }

  lineTotal(movement: InventoryMovement, item: InventoryMovement['items'][number]): number {
    return Number(unitAmount(movement, item)) * item.quantity;
  }
}
