import { Component, input, output } from '@angular/core';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  title?: string;
}

/**
 * Single-choice selector (view, scale, type...). Page-level filters use pill buttons instead.
 * `surface` picks the track color for the background it sits on; with `fill`, options share
 * the width the host is given (e.g. `class="w-full"`).
 */
@Component({
  selector: 'app-segmented-control',
  templateUrl: './segmented-control.html',
  host: {
    role: 'radiogroup',
    class: 'flex gap-1 rounded-full p-1',
    '[class.w-fit]': '!fill()',
    '[class.bg-base-100]': "surface() === 'page'",
    '[class.bg-base-200]': "surface() === 'card'",
    '[attr.aria-label]': 'label()',
  },
})
export class SegmentedControl<T extends string> {
  readonly options = input.required<readonly SegmentedOption<T>[]>();
  /** null (or a value outside options) leaves nothing selected. */
  readonly value = input.required<T | null>();
  readonly valueChange = output<T>();
  readonly label = input.required<string>();
  readonly surface = input<'page' | 'card'>('card');
  readonly fill = input(false);
}
