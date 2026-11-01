export type DifferenceTone = 'surplus' | 'shortage' | 'even';

export interface DifferenceView {
  label: string;
  icon: string;
  /** Fondo suave del estado: pills e íconos. */
  soft: string;
  /** Color del monto. */
  text: string;
}

/** Cuadrada en verde, faltante en rojo y sobrante en ámbar: un sobrante también pide revisar. */
export const DIFFERENCE_VIEW: Record<DifferenceTone, DifferenceView> = {
  even: { label: 'Cuadrada', icon: 'tablerCheck', soft: 'bg-success-soft text-success', text: 'text-success' },
  shortage: { label: 'Faltante', icon: 'tablerTrendingDown', soft: 'bg-error-soft text-error', text: 'text-error' },
  surplus: { label: 'Sobrante', icon: 'tablerTrendingUp', soft: 'bg-warning-soft text-warning', text: 'text-warning' },
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

/** Tiempo transcurrido corto: "45 min", "3 h 12 min" o "1 d 4 h". */
export function elapsedLabel(from: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(from).getTime()) / 60_000));
  if (minutes < 1) return 'menos de 1 min';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days) return hours ? `${days} d ${hours} h` : `${days} d`;
  if (hours) return rest ? `${hours} h ${rest} min` : `${hours} h`;
  return `${rest} min`;
}
