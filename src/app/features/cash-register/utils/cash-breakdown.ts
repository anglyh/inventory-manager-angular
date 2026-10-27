import type { CashRegister } from '../interfaces/cash-register.interface';

export type CashBreakdownKey = 'opening' | 'cashSales' | 'cashStays' | 'cashIn' | 'cashOut' | 'expected';

export interface CashBreakdownRow {
  /** Identificador estable de la fila (ícono, color, barra de composición). */
  key: CashBreakdownKey;
  label: string;
  /** Monto tal como llega de la API (string), sin signo. */
  value: string;
  sign?: '+' | '−';
  /** El esperado cierra la suma. */
  total?: boolean;
}

/**
 * Desglose del efectivo de la caja, en el orden en que suma:
 * fondo + ventas en efectivo + habitaciones en efectivo + aportes − retiros = esperado.
 * Solo se listan los campos presentes: cierres antiguos no tienen resumen y GUEST (cierre ciego)
 * no recibe ningún importe, solo la cantidad de ventas.
 */
export function cashBreakdown(
  register: Pick<CashRegister, 'openingAmount' | 'summary'>,
  { includeExpected = true }: { includeExpected?: boolean } = {},
): CashBreakdownRow[] {
  const rows: CashBreakdownRow[] = [{ key: 'opening', label: 'Fondo inicial', value: register.openingAmount }];
  const summary = register.summary;
  if (!summary) return rows;

  const components: (Omit<CashBreakdownRow, 'value'> & { value: string | undefined })[] = [
    { key: 'cashSales', label: 'Ventas en efectivo', value: summary.cashSales, sign: '+' },
    { key: 'cashStays', label: 'Habitaciones en efectivo', value: summary.cashStays, sign: '+' },
    { key: 'cashIn', label: 'Dinero que se puso', value: summary.cashIn, sign: '+' },
    { key: 'cashOut', label: 'Dinero que se sacó', value: summary.cashOut, sign: '−' },
  ];
  for (const row of components) {
    if (row.value !== undefined) rows.push({ ...row, value: row.value });
  }
  if (includeExpected && summary.expectedCash !== undefined) {
    rows.push({ key: 'expected', label: 'Debería haber', value: summary.expectedCash, total: true });
  }
  return rows;
}
