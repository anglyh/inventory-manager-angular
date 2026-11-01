import { formatDateRangeLabel, parseCallyRange, presetRange } from './date-range';

describe('presetRange', () => {
  it('builds each preset from the given Lima day, never past it', () => {
    const today = '2026-03-01';
    expect(presetRange('today', today)).toEqual({ from: '2026-03-01', to: '2026-03-01' });
    expect(presetRange('yesterday', today)).toEqual({ from: '2026-02-28', to: '2026-02-28' });
    expect(presetRange('last7', today)).toEqual({ from: '2026-02-23', to: '2026-03-01' });
    expect(presetRange('thisMonth', today)).toEqual({ from: '2026-03-01', to: '2026-03-01' });
    expect(presetRange('lastMonth', today)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
});

describe('formatDateRangeLabel', () => {
  it('formats single days, ranges and open ends in es-PE', () => {
    expect(formatDateRangeLabel({ from: null, to: null })).toBeNull();
    expect(formatDateRangeLabel({ from: '2026-10-26', to: '2026-10-26' })).toBe('26 oct 2026');
    expect(formatDateRangeLabel({ from: '2026-10-01', to: '2026-10-26' })).toBe('1 – 26 oct 2026');
    expect(formatDateRangeLabel({ from: '2026-10-26', to: '2026-11-01' })).toBe('26 oct – 1 nov 2026');
    expect(formatDateRangeLabel({ from: '2025-12-29', to: '2026-01-04' })).toBe('29 dic 2025 – 4 ene 2026');
    expect(formatDateRangeLabel({ from: '2026-10-01', to: null })).toBe('Desde 1 oct 2026');
    expect(formatDateRangeLabel({ from: null, to: '2026-10-26' })).toBe('Hasta 26 oct 2026');
  });

  it('reads the Cally range value', () => {
    expect(parseCallyRange('2026-10-01/2026-10-26')).toEqual({ from: '2026-10-01', to: '2026-10-26' });
    expect(parseCallyRange('')).toBeNull();
  });
});
