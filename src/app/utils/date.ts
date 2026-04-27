import { Temporal } from '@js-temporal/polyfill';

export function toStartOfDayISO(dateStr: string): string {
  const date = Temporal.PlainDate.from(dateStr);

  const instant = date.toZonedDateTime({
    timeZone: Temporal.Now.timeZoneId(),
    plainTime: Temporal.PlainTime.from('00:00')
  }).toInstant();

  return instant.toString();
}

export function toEndOfDayISO(dateStr: string): string {
  const date = Temporal.PlainDate.from(dateStr);

  const instant = date.toZonedDateTime({
    timeZone: Temporal.Now.timeZoneId(),
    plainTime: Temporal.PlainTime.from('23:59:59.999'),
  }).toInstant();

  return instant.toString();
}