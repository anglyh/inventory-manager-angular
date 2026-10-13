export type DifferenceTone = 'surplus' | 'shortage' | 'even';

export const DIFFERENCE_CLASS: Record<DifferenceTone, string> = {
  surplus: 'text-success',
  shortage: 'text-error',
  even: 'text-neutral',
};

/** Sobrante, faltante o cuadre exacto según el signo de la diferencia (string de la API). */
export function differenceTone(difference: string): DifferenceTone {
  const value = Number(difference);
  if (value > 0) return 'surplus';
  if (value < 0) return 'shortage';
  return 'even';
}

/** Signo visible de la diferencia; el monto se muestra en valor absoluto. */
export function differenceSign(difference: string): string {
  const value = Number(difference);
  return value > 0 ? '+' : value < 0 ? '−' : '';
}

export function absoluteAmount(value: string): number {
  return Math.abs(Number(value));
}
