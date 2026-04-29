import { Temporal } from '@js-temporal/polyfill';
import { ReportPeriod } from '../interfaces/report.interface';

/** Zona horaria del negocio (sin DST en la práctica: Perú). */
const LIMA = 'America/Lima';

function limaNow(): Temporal.ZonedDateTime {
  return Temporal.Now.zonedDateTimeISO(LIMA);
}

/** Inicio del día calendario en Lima → instante UTC (ISO string). */
function instantStartOfLimaDay(plain: Temporal.PlainDate): Temporal.Instant {
  return plain
    .toZonedDateTime({
      timeZone: LIMA,
      plainTime: Temporal.PlainTime.from('00:00:00'),
    })
    .toInstant();
}

/** Fin del día calendario en Lima (23:59:59.999) → instante UTC (ISO string). */
function instantEndOfLimaDay(plain: Temporal.PlainDate): Temporal.Instant {
  return plain
    .toZonedDateTime({
      timeZone: LIMA,
      plainTime: Temporal.PlainTime.from('23:59:59.999'),
    })
    .toInstant();
}

const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

function safePlainDate(s: string): Temporal.PlainDate | null {
  if (!PLAIN_DATE.test(s)) return null;
  try {
    return Temporal.PlainDate.from(s);
  } catch {
    return null;
  }
}

/**
 * Rangos predefinidos (Lima).
 * `from`: inicio del periodo (00:00 Lima).
 * `to`: instante actual.
 */
export function getLimaProfitRange(period: ReportPeriod): { from: string; to: string } {
  const z = limaNow();
  const to = z.toInstant().toString();
  const today = z.toPlainDate();

  let fromDay: Temporal.PlainDate;
  switch (period) {
    case 'today':
      fromDay = today;
      break;
    case 'week': {
      // ISO: lunes = 1 … domingo = 7
      const dow = today.dayOfWeek;
      fromDay = today.subtract({ days: dow - 1 });
      break;
    }
    case 'month':
      fromDay = new Temporal.PlainDate(today.year, today.month, 1);
      break;
  }

  return { from: instantStartOfLimaDay(fromDay).toString(), to };
}

/**
 * Rangos predefinidos (Lima) en formato `<input type="date">` (`YYYY-MM-DD`).
 * Útil para sincronizar la UI cuando se elige un preset.
 */
export function getLimaProfitPlainDateRange(
  period: ReportPeriod,
): { fromPlain: string; toPlain: string } {
  const today = limaNow().toPlainDate();

  let fromDay: Temporal.PlainDate;
  switch (period) {
    case 'today':
      fromDay = today;
      break;
    case 'week': {
      const dow = today.dayOfWeek;
      fromDay = today.subtract({ days: dow - 1 });
      break;
    }
    case 'month':
      fromDay = new Temporal.PlainDate(today.year, today.month, 1);
      break;
  }

  return { fromPlain: fromDay.toString(), toPlain: today.toString() };
}

/** Fecha calendario actual en Lima (`YYYY-MM-DD`). */
export function getLimaTodayPlainDate(): string {
  return limaNow().toPlainDate().toString();
}

/** `YYYY-MM-DD` como calendario Lima → inicio de ese día (ISO UTC). */
export function limaPlainDateToStartISO(plain: string): string {
  const d = safePlainDate(plain);
  if (!d) return Temporal.Instant.from('1970-01-01T00:00:00Z').toString();
  return instantStartOfLimaDay(d).toString();
}

/** `YYYY-MM-DD` como calendario Lima → fin de ese día (ISO UTC). */
export function limaPlainDateToEndISO(plain: string): string {
  const d = safePlainDate(plain);
  if (!d) return Temporal.Instant.from('1970-01-01T00:00:00Z').toString();
  return instantEndOfLimaDay(d).toString();
}

