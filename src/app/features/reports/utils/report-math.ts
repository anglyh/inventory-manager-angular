/** Variación % contra el período anterior; null si antes era 0 (no hay base para comparar). */
export function change(current: string | number, previous: string | number): number | null {
  const base = Number(previous);
  return base === 0 ? null : ((Number(current) - base) / Math.abs(base)) * 100;
}

export const percent = (value: number) => `${value.toFixed(0)}%`;

const MONEY = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Monto para textos cortos (hints): `S/ 1,234.50`. */
export const money = (value: string | number) => `S/ ${MONEY.format(Number(value))}`;

export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
