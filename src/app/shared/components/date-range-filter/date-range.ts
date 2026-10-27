import { Temporal } from '@js-temporal/polyfill';

/** Business time zone: "today" is always Lima's calendar day. */
const LIMA = 'America/Lima';
const LOCALE = 'es-PE';
const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Inclusive range of Lima calendar days (`YYYY-MM-DD`); either end may be open. */
export interface DateRangeValue {
  from: string | null;
  to: string | null;
}

export interface CompleteDateRange {
  from: string;
  to: string;
}

export type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth';

export const DATE_RANGE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'last7', label: 'Últimos 7 días' },
  { id: 'thisMonth', label: 'Este mes' },
  { id: 'lastMonth', label: 'Mes pasado' },
];

/** Current calendar day in Lima (`YYYY-MM-DD`). */
export function limaToday(): string {
  return Temporal.Now.plainDateISO(LIMA).toString();
}

/** Range of a preset relative to `today`; none of them goes past `today`. */
export function presetRange(preset: DateRangePreset, today: string): CompleteDateRange {
  const day = Temporal.PlainDate.from(today);
  const range = (from: Temporal.PlainDate, to: Temporal.PlainDate) => ({ from: from.toString(), to: to.toString() });
  switch (preset) {
    case 'today':
      return range(day, day);
    case 'yesterday': {
      const yesterday = day.subtract({ days: 1 });
      return range(yesterday, yesterday);
    }
    case 'last7':
      return range(day.subtract({ days: 6 }), day);
    case 'thisMonth':
      return range(day.with({ day: 1 }), day);
    case 'lastMonth': {
      const first = day.with({ day: 1 }).subtract({ months: 1 });
      return range(first, first.add({ months: 1 }).subtract({ days: 1 }));
    }
  }
}

/**
 * Day the calendar opens on (it pages from that day's month). With two months, a range that fits in
 * the current month opens on the previous one so the current month sits on the right, next to the past.
 */
export function calendarStartDate({ from, to }: DateRangeValue, today: string, months: 1 | 2): string {
  const start = from ?? to ?? today;
  if (months === 1) return start;
  const end = Temporal.PlainDate.from(to ?? from ?? today);
  const first = Temporal.PlainDate.from(start);
  const now = Temporal.PlainDate.from(today);
  const sameMonth = first.year === end.year && first.month === end.month;
  const endBeforeCurrentMonth = end.year * 12 + end.month < now.year * 12 + now.month;
  return sameMonth && !endBeforeCurrentMonth ? first.subtract({ months: 1 }).toString() : start;
}

/** Cally's range value is `YYYY-MM-DD/YYYY-MM-DD`; null while it is empty or malformed. */
export function parseCallyRange(value: string): CompleteDateRange | null {
  const [from, to] = value.split('/');
  if (!from || !to || !PLAIN_DATE.test(from) || !PLAIN_DATE.test(to)) return null;
  return from <= to ? { from, to } : { from: to, to: from };
}

function format(date: Temporal.PlainDate, options: Intl.DateTimeFormatOptions): string {
  // "26 oct. 2026" → "26 oct 2026"
  return date.toLocaleString(LOCALE, options).replace(/\./g, '').replace(/ de /g, ' ');
}

const DAY_MONTH_YEAR: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

/** "26 oct 2026", "1 – 26 oct 2026", "26 oct – 1 nov 2026", "Desde 1 oct 2026"; null when empty. */
export function formatDateRangeLabel({ from, to }: DateRangeValue): string | null {
  if (!from && !to) return null;
  if (!to) return `Desde ${format(Temporal.PlainDate.from(from!), DAY_MONTH_YEAR)}`;
  if (!from) return `Hasta ${format(Temporal.PlainDate.from(to), DAY_MONTH_YEAR)}`;

  const start = Temporal.PlainDate.from(from);
  const end = Temporal.PlainDate.from(to);
  const endLabel = format(end, DAY_MONTH_YEAR);
  if (start.equals(end)) return endLabel;

  const sameYear = start.year === end.year;
  const startLabel =
    sameYear && start.month === end.month ? `${start.day}`
    : format(start, sameYear ? { day: 'numeric', month: 'short' } : DAY_MONTH_YEAR);
  return `${startLabel} – ${endLabel}`;
}
