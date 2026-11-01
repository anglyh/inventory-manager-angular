import { Component, computed, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { StayListItem } from '../../interfaces/stay.interface';
import { DOCUMENT_TYPE_SHORT, GUARDIAN_RELATION_LABEL, SEX_LABEL } from '../../utils/stay-labels';

interface RegisterRow {
  key: string;
  stay: StayListItem;
  /** La primera fila de la estadía lleva sus datos (rowspan). */
  first: boolean;
  /** La última fila cierra la estadía con el divisor. */
  last: boolean;
  span: number;
  fullName: string;
  isHolder: boolean;
  minorRelation: string | null;
  document: string;
  nationality: string;
  birthDate: string;
  sex: string;
  residence: string;
}

/** Registro de huéspedes: una fila por persona, agrupadas por estadía. */
@Component({
  selector: 'guest-register-table',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './guest-register-table.html',
  host: { class: 'block' },
})
export class GuestRegisterTable {
  stays = input.required<StayListItem[]>();
  /** Clic en cualquier fila de la estadía. El enlace de la primera celda sigue para el teclado. */
  staySelected = output<string>();

  /** Estadía bajo el mouse: sus filas (una por persona) se resaltan juntas. */
  readonly hoveredStayId = signal<string | null>(null);

  readonly rows = computed<RegisterRow[]>(() =>
    this.stays().flatMap(stay => {
      const span = stay.guests.length + stay.minors.length;
      const guests = [...stay.guests].sort((a, b) => Number(b.isHolder) - Number(a.isHolder));
      const adults = guests.map(guest => ({
        // Un mismo huésped puede repetirse en otra estadía del período.
        key: `${stay.id}:${guest.id}`,
        fullName: guest.fullName,
        isHolder: guest.isHolder,
        minorRelation: null,
        document: `${DOCUMENT_TYPE_SHORT[guest.documentType]} ${guest.documentNumber}`,
        nationality: guest.nationality,
        birthDate: guest.birthDate,
        sex: SEX_LABEL[guest.sex],
        residence: guest.residence,
      }));
      const minors = stay.minors.map(minor => ({
        key: `${stay.id}:${minor.id}`,
        fullName: minor.fullName,
        isHolder: false,
        minorRelation: GUARDIAN_RELATION_LABEL[minor.guardianRelation],
        document: minor.documentNumber
          ? `${minor.documentType ? DOCUMENT_TYPE_SHORT[minor.documentType] : ''} ${minor.documentNumber}`.trim()
          : 'Sin documento',
        nationality: '—',
        birthDate: minor.birthDate,
        sex: '',
        residence: '',
      }));
      return [...adults, ...minors].map((person, index) => ({
        ...person,
        stay,
        first: index === 0,
        last: index === span - 1,
        span,
      }));
    }),
  );
}
