import type { InventoryMovement, MovementGroup, MovementReason, MovementType, PaymentMethod } from '../interfaces/inventory-movement.interface';

export const REASON_LABELS: Record<MovementReason, string> = {
  SALE: 'Venta',
  PURCHASE: 'Compra',
  LOSS_EXPIRED: 'Merma por vencimiento',
  LOSS_DAMAGED: 'Merma por daño',
  COUNT_SURPLUS: 'Sobrante de conteo',
  COUNT_SHORTAGE: 'Faltante de conteo',
  INITIAL_LOAD: 'Stock inicial',
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
  { value: 'loss', label: 'Mermas' },
  { value: 'voids', label: 'Anulados' },
];

/** Qué operación fue (venta, compra…), no hacia dónde se movió el stock: así lo piensa el dueño. */
export type MovementKind = 'sale' | 'purchase' | 'loss' | 'count' | 'initial' | 'voided';

const KIND_BY_REASON: Record<MovementReason, MovementKind> = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  LOSS_EXPIRED: 'loss',
  LOSS_DAMAGED: 'loss',
  COUNT_SURPLUS: 'count',
  COUNT_SHORTAGE: 'count',
  INITIAL_LOAD: 'initial',
};

export function reasonKind(reason: MovementReason): MovementKind {
  return KIND_BY_REASON[reason];
}

export function movementKind(movement: InventoryMovement): MovementKind {
  return movement.status === 'VOIDED' ? 'voided' : reasonKind(movement.reason);
}

/** Ícono, color y etiqueta corta por tipo. Literales completos para que Tailwind los detecte. */
export const KIND_VIEW: Record<MovementKind, { label: string; icon: string; tone: string }> = {
  sale: { label: 'Venta', icon: 'tablerShoppingCart', tone: 'bg-success-soft text-success' },
  purchase: { label: 'Compra', icon: 'tablerTruck', tone: 'bg-info-soft text-info' },
  loss: { label: 'Merma', icon: 'tablerAlertTriangle', tone: 'bg-error-soft text-error' },
  count: { label: 'Conteo', icon: 'tablerClipboardCheck', tone: 'bg-warning-soft text-warning' },
  initial: { label: 'Stock inicial', icon: 'tablerPackage', tone: 'bg-base-200 text-neutral' },
  voided: { label: 'Anulado', icon: 'tablerBan', tone: 'bg-base-200 text-neutral' },
};

/** Las ventas guardan el precio cobrado; el resto de movimientos, el costo. */
export function unitAmount(movement: InventoryMovement, item: InventoryMovement['items'][number]): string {
  return movement.reason === 'SALE' ? item.unitPrice : item.unitCost;
}
