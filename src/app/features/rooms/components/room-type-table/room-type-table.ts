import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerDots } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import type { RoomType } from '../../interfaces/room.interface';

/** Tipos de habitación con sus tarifas, cuántas habitaciones los usan y acciones por fila. */
@Component({
  selector: 'room-type-table',
  imports: [Button, DecimalPipe, NgIcon],
  viewProviders: [provideIcons({ tablerDots })],
  templateUrl: './room-type-table.html',
  host: { class: 'block' },
})
export class RoomTypeTable {
  roomTypes = input.required<RoomType[]>();
  /** Fila con una acción en curso. */
  busyId = input<string | null>(null);

  edit = output<RoomType>();
  toggleActive = output<RoomType>();
  remove = output<RoomType>();

  /** Los dropdown de daisyUI se cierran al perder el foco: tras elegir, se suelta. */
  blurActive() {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}
