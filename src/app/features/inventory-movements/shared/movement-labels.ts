import type { InventoryMovement, MovementGroup, MovementReason, MovementType, PaymentMethod } from '../interfaces/inventory-movement.interface';

export const REASON_LABELS: Record<MovementReason, string> = {
  SALE: 'Venta',
  PURCHASE: 'Compra',
  LOSS_EXPIRED: 'Merma por vencimiento',
  LOSS_DAMAGED: 'Merma por daño',
  COUNT_SURPLUS: 'Sobrante de conteo',
  COUNT_SHORTAGE: 'Faltante de conteo',
  INITIAL_LOAD: 'Carga inicial',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  YAPE: 'Yape',
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  IN: 'Entradas',
  OUT: 'Salidas',
};

export const GROUP_OPTIONS: { value: MovementGroup | undefined; label: string }[] = [
  { value: undefined, label: 'Todos' },
  { value: 'sales', label: 'Ventas' },
  { value: 'purchase', label: 'Compras' },
  { value: 'loss', label: 'Pérdidas' },
  { value: 'voids', label: 'Anulados' },
];

export type MovementTone = 'in' | 'out' | 'loss' | 'voided';

const LOSS_REASONS: MovementReason[] = ['LOSS_EXPIRED', 'LOSS_DAMAGED', 'COUNT_SHORTAGE'];

/** Como un registro de llamadas: el color dice qué pasó antes de leer el texto. */
export function movementTone(movement: InventoryMovement): MovementTone {
  if (movement.status === 'VOIDED') return 'voided';
  if (LOSS_REASONS.includes(movement.reason)) return 'loss';
  return movement.movementType === 'IN' ? 'in' : 'out';
}

/** Las ventas guardan el precio cobrado; el resto de movimientos, el costo. */
export function unitAmount(movement: InventoryMovement, item: InventoryMovement['items'][number]): string {
  return movement.reason === 'SALE' ? item.unitPrice : item.unitCost;
}
