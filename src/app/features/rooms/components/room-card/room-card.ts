import { Component, computed, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerArrowRight, tablerClock, tablerSparkles, tablerUser } from '@ng-icons/tabler-icons';
import type { Room, RoomStatus } from '../../interfaces/room.interface';
import { formatDuration } from '../../utils/stay-time';

/**
 * Excepción a "el color es una señal": en el tablero el estado ES la información.
 * Libre en verde (lo que busca recepción), ocupada en neutro, limpieza en ámbar y vencida en rojo.
 * Literales completos para que Tailwind los detecte.
 */
type BoardState = RoomStatus | 'OVERDUE';

const BOARD_VIEW: Record<BoardState, { label: string; accent: string; badge: string; dot: string }> = {
  FREE: { label: 'Libre', accent: 'bg-success', badge: 'bg-success-soft text-success', dot: 'bg-success' },
  OCCUPIED: { label: 'Ocupada', accent: 'bg-neutral', badge: 'bg-base-200 text-base-content', dot: 'bg-neutral' },
  CLEANING: { label: 'Limpieza', accent: 'bg-warning', badge: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  OVERDUE: { label: 'Vencida', accent: 'bg-error', badge: 'bg-error-soft text-error', dot: 'bg-error' },
};

/** Lo que pasa al tocar la card, según el estado. */
const ACTION_LABEL: Record<RoomStatus, string> = {
  FREE: 'Registrar ingreso',
  OCCUPIED: 'Ver estadía',
  CLEANING: 'Marcar lista',
};

const DAY_MS = 86_400_000;

/** Card del tablero: estado de un vistazo y la próxima acción. Ocupada muestra quién, hasta cuándo y si debe. */
@Component({
  selector: 'room-card',
  imports: [DatePipe, DecimalPipe, NgIcon],
  viewProviders: [provideIcons({ tablerArrowRight, tablerClock, tablerSparkles, tablerUser })],
  templateUrl: './room-card.html',
  host: { class: 'block' },
})
export class RoomCard {
  room = input.required<Room>();
  /** Momento de referencia para marcar la salida vencida (lo refresca el contenedor). */
  now = input(Date.now());
  selected = output<Room>();

  /** Una ocupada con la salida pasada se muestra como "Vencida". */
  readonly view = computed(() => {
    const status = this.room().status;
    return BOARD_VIEW[status === 'OCCUPIED' && this.overdueMinutes() > 0 ? 'OVERDUE' : status];
  });
  readonly statusLabel = computed(() => this.view().label);
  readonly actionLabel = computed(() => ACTION_LABEL[this.room().status]);

  /** Minutos pasados de la salida prevista (0 si aún no vence). */
  readonly overdueMinutes = computed(() => {
    const stay = this.room().activeStay;
    if (!stay) return 0;
    const diff = this.now() - new Date(stay.expectedCheckOut).getTime();
    return diff > 0 ? Math.floor(diff / 60_000) : 0;
  });
  readonly overdueLabel = computed(() => formatDuration(this.overdueMinutes()));

  /** "hoy", "mañana" o null (se muestra la fecha). */
  readonly checkOutDay = computed(() => {
    const stay = this.room().activeStay;
    if (!stay) return null;
    const today = new Date(this.now());
    today.setHours(0, 0, 0, 0);
    const out = new Date(stay.expectedCheckOut);
    out.setHours(0, 0, 0, 0);
    const days = Math.round((out.getTime() - today.getTime()) / DAY_MS);
    return days === 0 ? 'hoy' : days === 1 ? 'mañana' : null;
  });

  readonly balance = computed(() => Number(this.room().activeStay?.balance ?? 0));
}
