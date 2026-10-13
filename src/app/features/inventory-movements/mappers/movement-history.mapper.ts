import type { ParamMap, Params } from '@angular/router';
import type {
  InventoryMovementQuery,
  MovementCursor,
  MovementFilters,
  MovementGroup,
  MovementReason,
  MovementType,
} from '../interfaces/inventory-movement.interface';
import { GROUP_OPTIONS, REASON_LABELS } from '../shared/movement-labels';

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PAGE_SIZE = 20;
const FILTER_KEYS: (keyof MovementFilters)[] = ['group', 'movementType', 'reason', 'productId', 'from', 'to', 'cashRegisterId'];

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** Medianoche local del día indicado, en ISO con zona horaria. */
function startOfLocalDay(day: string, offsetDays = 0): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date + offsetDays).toISOString();
}

export class MovementHistoryMapper {
  /** Ignora valores desconocidos para que una URL editada a mano no rompa la consulta. */
  static fromParams(params: ParamMap): MovementFilters {
    const day = (key: string) => {
      const value = params.get(key);
      return value && DAY_PATTERN.test(value) ? value : undefined;
    };

    return {
      group: pick<MovementGroup>(params.get('group'), GROUP_OPTIONS.map(option => option.value).filter(Boolean) as MovementGroup[]),
      movementType: pick<MovementType>(params.get('movementType'), ['IN', 'OUT']),
      reason: pick<MovementReason>(params.get('reason'), Object.keys(REASON_LABELS) as MovementReason[]),
      productId: params.get('productId') ?? undefined,
      from: day('from'),
      to: day('to'),
      cashRegisterId: params.get('cashRegisterId') ?? undefined,
    };
  }

  /**
   * Incluye todas las claves: `null` elimina el parámetro al combinarlo con la
   * URL actual, así un filtro omitido (p. ej. al limpiar) no sobrevive.
   */
  static toParams(filters: MovementFilters): Params {
    return Object.fromEntries(FILTER_KEYS.map(key => [key, filters[key] || null]));
  }

  static toQuery(filters: MovementFilters, cursor: MovementCursor | null): InventoryMovementQuery {
    return {
      group: filters.group,
      movementType: filters.movementType,
      reason: filters.reason,
      productId: filters.productId,
      cashRegisterId: filters.cashRegisterId,
      from: filters.from ? startOfLocalDay(filters.from) : undefined,
      // El contrato usa `to` exclusivo: el día elegido se incluye completo.
      to: filters.to ? startOfLocalDay(filters.to, 1) : undefined,
      limit: PAGE_SIZE,
      cursorDate: cursor?.cursorDate,
      cursorId: cursor?.cursorId,
    };
  }

  static activeFiltersCount(filters: MovementFilters): number {
    const { group, cashRegisterId, ...rest } = filters;
    return Object.values(rest).filter(Boolean).length;
  }
}
