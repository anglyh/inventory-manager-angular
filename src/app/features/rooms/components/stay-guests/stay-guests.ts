import { Component, computed, input } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import type { StayGuest, StayMinor } from '../../interfaces/stay.interface';
import { DOCUMENT_TYPE_SHORT, GUARDIAN_RELATION_LABEL } from '../../utils/stay-labels';

/** Huéspedes adultos (el principal primero, luego acompañantes) y menores de una estadía. */
@Component({
  selector: 'stay-guests',
  imports: [DatePipe, LowerCasePipe],
  templateUrl: './stay-guests.html',
  host: { class: 'block' },
})
export class StayGuests {
  guests = input.required<StayGuest[]>();
  minors = input<StayMinor[]>([]);

  readonly sortedGuests = computed(() => [...this.guests()].sort((a, b) => Number(b.isHolder) - Number(a.isHolder)));

  readonly documentShort = DOCUMENT_TYPE_SHORT;
  readonly relationLabel = GUARDIAN_RELATION_LABEL;
}
