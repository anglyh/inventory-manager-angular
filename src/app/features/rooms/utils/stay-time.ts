import { Temporal } from '@js-temporal/polyfill';
import type { RateKind, StoreSettings } from '../interfaces/room.interface';

/** Zona horaria del negocio. */
const LIMA = 'America/Lima';
/** Antes de esta hora, una noche que empieza de madrugada sale ese mismo día. */
const EARLY_MORNING_HOUR = 6;

function nowInLima(): Temporal.ZonedDateTime {
  return Temporal.Now.zonedDateTimeISO(LIMA);
}

/** Valor para `<input type="datetime-local">` (hora Lima, sin segundos). */
function toLocalInput(value: Temporal.ZonedDateTime): string {
  return value.toPlainDateTime().toString({ smallestUnit: 'minute' });
}

/** Valor de `datetime-local` (hora Lima) → instante ISO UTC; null si no es válido. */
export function limaInputToIso(value: string): string | null {
  if (!value) return null;
  try {
    return Temporal.PlainDateTime.from(value).toZonedDateTime(LIMA).toInstant().toString();
  } catch {
    return null;
  }
}

/**
 * Salida sugerida, igual que el backend: por horas = ahora + horas elegidas;
 * noche = día siguiente a la hora de salida (de madrugada, antes de esa hora, el mismo día).
 */
export function suggestedCheckOut(rateKind: RateKind, hours: number, settings: StoreSettings): string {
  const now = nowInLima();
  if (rateKind === 'HOURLY') return toLocalInput(now.add({ hours }));

  const checkoutTime = Temporal.PlainTime.from(settings.checkoutTime);
  const sameDay = now.hour < EARLY_MORNING_HOUR && Temporal.PlainTime.compare(now.toPlainTime(), checkoutTime) < 0;
  const date = sameDay ? now.toPlainDate() : now.toPlainDate().add({ days: 1 });
  return toLocalInput(date.toZonedDateTime({ timeZone: LIMA, plainTime: checkoutTime }));
}

/** Edad cumplida a hoy (Lima) para una fecha `YYYY-MM-DD`; null si no es válida o es futura. */
export function ageFromBirthDate(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  try {
    const birth = Temporal.PlainDate.from(birthDate);
    const today = nowInLima().toPlainDate();
    if (Temporal.PlainDate.compare(birth, today) > 0) return null;
    return birth.until(today, { largestUnit: 'years' }).years;
  } catch {
    return null;
  }
}

/** Minutos transcurridos desde un instante (negativo si aún no llega). */
export function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

/** "2 h 15 min", "40 min". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
