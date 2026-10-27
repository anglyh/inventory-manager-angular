import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import 'cally';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerCalendar, tablerChevronDown, tablerChevronLeft, tablerChevronRight } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import {
  DATE_RANGE_PRESETS,
  type DateRangePreset,
  type DateRangeValue,
  calendarStartDate,
  formatDateRangeLabel,
  limaToday,
  parseCallyRange,
  presetRange,
} from './date-range';

/** Two months side by side only when the panel has room for them. */
const WIDE_QUERY = '(min-width: 1024px)';

/**
 * Date range filter: one button with the active range that opens presets and a range calendar (Cally).
 * Choosing a preset or the second day applies at once and closes the panel. Dates are Lima days `YYYY-MM-DD`.
 * On a phone the panel is a sheet at the bottom of the screen; from `md` it floats under the button.
 */
@Component({
  selector: 'app-date-range-filter',
  imports: [NgIcon, Button],
  viewProviders: [provideIcons({ tablerCalendar, tablerChevronDown, tablerChevronLeft, tablerChevronRight })],
  templateUrl: './date-range-filter.html',
  styleUrl: './date-range-filter.css',
  // Cally is styled through `::part()`, which emulated encapsulation does not rewrite; the rules are scoped by class.
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    class: 'relative inline-flex',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'onEscape()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class DateRangeFilter {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  from = input<string | null>(null);
  to = input<string | null>(null);
  /** Last day that can be picked (`YYYY-MM-DD`); pages that forbid future dates pass today. */
  max = input<string | null>(null);
  /** Allows going back to "no dates" with "Limpiar". */
  clearable = input(false);
  /** Hide the quick ranges when the page already offers its own periods. */
  presets = input(true);
  /** Icon-only trigger (the page shows the range elsewhere). */
  compact = input(false);
  /** Compact trigger in `primary`: the page is filtering by this range. */
  active = input(false);
  /** Where the trigger sits: on a card (`bg-base-100`) or on the page background (`bg-base-200`). */
  surface = input<'card' | 'page'>('card');
  /** Panel edge aligned with the trigger from `md` up. */
  align = input<'start' | 'end'>('start');
  placeholder = input('Elegir fechas');
  ariaLabel = input('Rango de fechas');

  rangeChange = output<DateRangeValue>();

  readonly presetOptions = DATE_RANGE_PRESETS;
  readonly open = signal(false);
  readonly today = signal(limaToday());
  private readonly wide = signal(false);

  readonly hasRange = computed(() => !!(this.from() || this.to()));
  readonly label = computed(() => formatDateRangeLabel({ from: this.from(), to: this.to() }) ?? this.placeholder());
  readonly showClear = computed(() => this.clearable() && this.hasRange());
  readonly months = computed<1 | 2>(() => (this.wide() ? 2 : 1));

  readonly callyValue = computed(() => {
    const from = this.from();
    const to = this.to();
    return from && to ? `${from}/${to}` : '';
  });

  readonly focusedDate = computed(() =>
    calendarStartDate({ from: this.from(), to: this.to() }, this.today(), this.months()),
  );

  readonly activePreset = computed<DateRangePreset | null>(() => {
    const from = this.from();
    const to = this.to();
    if (!from || !to) return null;
    const today = this.today();
    return this.presetOptions.find(({ id }) => {
      const range = presetRange(id, today);
      return range.from === from && range.to === to;
    })?.id ?? null;
  });

  readonly triggerClass = computed(() => {
    const background = this.surface() === 'page' ? 'bg-base-100' : 'bg-base-200';
    return this.compact()
      ? this.active() || this.open() ? 'btn-circle' : `btn-circle ${background}`
      : `w-full justify-start font-normal ${background}`;
  });

  readonly panelAlignClass = computed(() => (this.align() === 'end' ? 'md:right-0' : 'md:left-0'));

  constructor() {
    if (typeof matchMedia === 'undefined') return;
    const query = matchMedia(WIDE_QUERY);
    this.wide.set(query.matches);
    const onChange = (event: MediaQueryListEvent) => this.wide.set(event.matches);
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }

  toggle() {
    if (this.open()) {
      this.open.set(false);
      return;
    }
    this.today.set(limaToday());
    this.open.set(true);
  }

  selectPreset(preset: DateRangePreset) {
    this.apply(presetRange(preset, this.today()));
  }

  /** Cally fires `change` once both ends are picked; its value is `YYYY-MM-DD/YYYY-MM-DD`. */
  onCalendarChange(event: Event) {
    const range = parseCallyRange((event.target as HTMLElement & { value: string }).value);
    if (range) this.apply(range);
  }

  clear() {
    this.apply({ from: null, to: null });
  }

  presetClass(preset: DateRangePreset): string {
    return this.activePreset() === preset
      ? 'bg-primary text-primary-content'
      : 'bg-base-200 md:bg-transparent md:hover:bg-base-200';
  }

  close(restoreFocus = false) {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.host.nativeElement.querySelector('button')?.focus();
  }

  onDocumentClick(event: MouseEvent) {
    if (this.open() && !event.composedPath().includes(this.host.nativeElement)) this.close();
  }

  onEscape() {
    this.close(true);
  }

  /** Tabbing out of the panel closes it; a click on a non-focusable spot inside (no target) does not. */
  onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (next && !this.host.nativeElement.contains(next)) this.close();
  }

  private apply(range: DateRangeValue) {
    this.rangeChange.emit(range);
    this.close(true);
  }
}
