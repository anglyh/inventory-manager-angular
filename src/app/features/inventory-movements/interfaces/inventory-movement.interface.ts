import type { components, paths } from 'src/app/api/generated/schema';

export type InventoryMovement = components['schemas']['InventoryMovement'];
export type MovementItem = InventoryMovement['items'][number];
export type MovementType = InventoryMovement['movementType'];
export type MovementReason = InventoryMovement['reason'];
export type MovementStatus = InventoryMovement['status'];
export type PaymentMethod = NonNullable<InventoryMovement['paymentMethod']>;

export type InventoryMovementsPage = components['schemas']['InventoryMovementsPage'];
export type VoidMovementRequest = components['schemas']['VoidMovement'];
export type MovementCursor = NonNullable<InventoryMovementsPage['nextCursor']>;

export type InventoryMovementQuery = NonNullable<paths['/api/inventory-movement']['get']['parameters']['query']>;
export type MovementGroup = NonNullable<InventoryMovementQuery['group']>;

/**
 * Filtros tal como los maneja la UI y la URL. Las fechas son días locales
 * (`yyyy-mm-dd`) y `to` es inclusivo; el mapper los convierte al contrato.
 */
export interface MovementFilters {
  group?: MovementGroup;
  movementType?: MovementType;
  reason?: MovementReason;
  productId?: string;
  from?: string;
  to?: string;
  cashRegisterId?: string;
}
