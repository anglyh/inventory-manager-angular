import { Temporal } from '@js-temporal/polyfill';
import type { ReportScale } from '../interfaces/report.interface';

/** Zona horaria del negocio (sin DST en la práctica: Perú). */
const LIMA = 'America/Lima';
const LOCALE = 'es-PE';

const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Rango de días calendario Lima, ambos inclusivos (`YYYY-MM-DD`). */
export interface PlainRange {
  from: string;
  to: string;
}

function today(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO(LIMA);
}

/** Fecha calendario actual en Lima (`YYYY-MM-DD`). */
export function getLimaTodayPlainDate(): string {
  return today().toString();
}

/** `YYYY-MM-DD` válido o null. */
export function parsePlainDate(value: string | null): string | null {
  if (!value || !PLAIN_DATE.test(value)) return null;
  try {
    return Temporal.PlainDate.from(value).toString();
  } catch {
    return null;
  }
}

/** Período (día, semana lunes–domingo, mes o año) que contiene a `anchor`. */
export function getPeriodRange(scale: ReportScale, anchor: string): PlainRange {
  const date = Temporal.PlainDate.from(anchor);
  switch (scale) {
    case 'day':
      return { from: date.toString(), to: date.toString() };
    case 'week': {
      const monday = date.subtract({ days: date.dayOfWeek - 1 });
      return { from: monday.toString(), to: monday.add({ days: 6 }).toString() };
    }
    case 'month': {
      const first = date.with({ day: 1 });
      return { from: first.toString(), to: first.add({ months: 1 }).subtract({ days: 1 }).toString() };
    }
    case 'year': {
      const first = date.with({ month: 1, day: 1 });
      return { from: first.toString(), to: first.add({ years: 1 }).subtract({ days: 1 }).toString() };
    }
  }
}

/** Recorta el final del rango a hoy: un período en curso se consulta "hasta la fecha". */
export function clampToToday(range: PlainRange): PlainRange {
  const now = today().toString();
  return range.to > now ? { from: range.from, to: now } : range;
}

/**
 * Mismo tramo del período anterior: "1–13 oct" se compara con "1–13 sep", no con los 13 días previos.
 * Si el período anterior es más corto (31 → 30 días), se recorta a su último día.
 */
export function getComparisonRange(scale: ReportScale, range: PlainRange): PlainRange {
  const from = Temporal.PlainDate.from(range.from);
  const elapsedDays = from.until(Temporal.PlainDate.from(range.to)).days;
  const previous = getPeriodRange(scale, shiftAnchor(scale, range.from, -1));
  const previousFrom = Temporal.PlainDate.from(previous.from);
  const end = previousFrom.add({ days: elapsedDays });
  return {
    from: previous.from,
    to: Temporal.PlainDate.compare(end, previous.to) > 0 ? previous.to : end.toString(),
  };
}

/** Mueve `anchor` un período hacia atrás (-1) o adelante (+1). */
export function shiftAnchor(scale: ReportScale, anchor: string, step: -1 | 1): string {
  const date = Temporal.PlainDate.from(anchor);
  const duration =
    scale === 'day' ? { days: step }
    : scale === 'week' ? { weeks: step }
    : scale === 'month' ? { months: step }
    : { years: step };
  return date.add(duration).toString();
}

/** El período de `anchor` incluye hoy (no se puede avanzar más). */
export function isCurrentPeriod(scale: ReportScale, anchor: string): boolean {
  const { to } = getPeriodRange(scale, anchor);
  return Temporal.PlainDate.compare(to, today()) >= 0;
}

/** `YYYY-MM-DD` Lima → instante de inicio del día (ISO UTC). */
export function limaPlainDateToStartISO(plain: string): string {
  return Temporal.PlainDate.from(plain).toZonedDateTime({ timeZone: LIMA }).toInstant().toString();
}

/** `YYYY-MM-DD` Lima → inicio del día siguiente (ISO UTC); el backend trata `to` como exclusivo. */
export function limaPlainDateToEndISO(plain: string): string {
  return limaPlainDateToStartISO(Temporal.PlainDate.from(plain).add({ days: 1 }).toString());
}

function format(date: Temporal.PlainDate, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString(LOCALE, options).replace(/\./g, '');
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Etiqueta legible del rango: "Hoy, 12 oct", "6 – 12 oct 2026", "Octubre 2026", "2026". */
export function formatRangeLabel(scale: ReportScale | 'custom', range: PlainRange): string {
  const from = Temporal.PlainDate.from(range.from);
  const to = Temporal.PlainDate.from(range.to);
  const now = today();

  if (scale === 'day') {
    const dayMonth = format(from, { day: 'numeric', month: 'short' });
    if (from.equals(now)) return `Hoy, ${dayMonth}`;
    if (from.equals(now.subtract({ days: 1 }))) return `Ayer, ${dayMonth}`;
    return capitalize(format(from, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
  }

  if (scale === 'year') return String(from.year);

  if (scale === 'month') {
    // "octubre de 2026" → "Octubre 2026"
    return capitalize(format(from, { month: 'long', year: 'numeric' }).replace(' de ', ' '));
  }

  if (from.equals(to)) return format(from, { day: 'numeric', month: 'short', year: 'numeric' });

  const sameYear = from.year === to.year;
  const sameMonth = sameYear && from.month === to.month;
  const start = sameMonth
    ? `${from.day}`
    : format(from, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  return `${start} – ${format(to, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
