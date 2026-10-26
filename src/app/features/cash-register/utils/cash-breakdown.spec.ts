import type { CashRegisterSummary } from '../interfaces/cash-register.interface';
import { cashBreakdown, type CashBreakdownRow } from './cash-breakdown';

const summary: CashRegisterSummary = {
  cashSales: '50.50',
  cashStays: '80.00',
  cashIn: '20.00',
  cashOut: '30.25',
  expectedCash: '220.25',
  difference: null,
  salesCount: 3,
  totalSales: '75.50',
  yapeSales: '25.00',
  yapeStays: '40.00',
};

/** Suma con signo de los componentes, en céntimos para no arrastrar errores de coma flotante. */
function signedCents(rows: CashBreakdownRow[]): number {
  return rows
    .filter(row => !row.total)
    .reduce((sum, row) => sum + (row.sign === '−' ? -1 : 1) * Math.round(Number(row.value) * 100), 0);
}

describe('cashBreakdown', () => {
  it('lista los componentes en orden, incluye habitaciones y suma el esperado', () => {
    const rows = cashBreakdown({ openingAmount: '100.00', summary });

    expect(rows.map(row => row.label)).toEqual([
      'Fondo inicial',
      'Ventas en efectivo',
      'Habitaciones en efectivo',
      'Dinero que se puso',
      'Dinero que se sacó',
      'Debería haber',
    ]);
    expect(signedCents(rows)).toBe(Math.round(Number(summary.expectedCash) * 100));
  });

  it('sin esperado (GUEST) o sin resumen no agrega filas que no vinieron', () => {
    const { expectedCash, ...guestSummary } = summary;

    expect(cashBreakdown({ openingAmount: '100.00', summary: guestSummary }).some(row => row.total)).toBe(false);
    expect(cashBreakdown({ openingAmount: '100.00', summary: null }).map(row => row.label)).toEqual(['Fondo inicial']);
  });
});
