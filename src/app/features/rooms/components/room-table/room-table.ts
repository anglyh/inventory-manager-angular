import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerDots } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import type { Room } from '../../interfaces/room.interface';

interface RoomBadge {
  label: string;
  class: string;
}

/** Habitaciones configuradas: número, piso, tipo, estado y acciones por fila. */
@Component({
  selector: 'room-table',
  imports: [Button, NgIcon],
  viewProviders: [provideIcons({ tablerDots })],
  templateUrl: './room-table.html',
  host: { class: 'block' },
})
export class RoomTable {
  rooms = input.required<Room[]>();
  /** Fila con una acción en curso. */
  busyId = input<string | null>(null);

  edit = output<Room>();
  toggleActive = output<Room>();
  remove = output<Room>();

  badgeOf(room: Room): RoomBadge {
    if (!room.isActive) return { label: 'Inactiva', class: 'bg-warning-soft text-warning' };
    if (room.status === 'OCCUPIED') return { label: 'Ocupada', class: 'bg-info-soft text-info' };
    return { label: 'Activa', class: 'bg-base-200 text-neutral' };
  }

  /** Los dropdown de daisyUI se cierran al perder el foco: tras elegir, se suelta. */
  blurActive() {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}
