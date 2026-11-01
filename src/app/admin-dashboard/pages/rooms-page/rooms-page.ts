import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { AuthService } from '@/auth/services/auth.service';
import { Button } from '@/shared/components/button/button';
import { ModuleTabs } from '@/shared/components/module-tabs/module-tabs';
import { ROOMS_TABS } from '@/admin-dashboard/module-tabs';
import { Modal } from '@/shared/components/modal/modal';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';
import { RoomService } from '@/features/rooms/services/room.service';
import { RoomCard } from '@/features/rooms/components/room-card/room-card';
import type { Room, RoomStatus } from '@/features/rooms/interfaces/room.interface';

interface FloorGroup {
  floor: number | null;
  rooms: Room[];
}

type RoomFilter = 'all' | RoomStatus;

const FILTERS: { value: RoomFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'FREE', label: 'Libres' },
  { value: 'OCCUPIED', label: 'Ocupadas' },
  { value: 'CLEANING', label: 'Limpieza' },
];

/** Cada minuto se recalcula qué salidas ya vencieron. */
const CLOCK_TICK_MS = 60_000;

@Component({
  selector: 'app-rooms-page',
  imports: [DecimalPipe, NgIcon, Button, Modal, RoomCard, ModuleTabs],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './rooms-page.html',
})
export class RoomsPage {
  private roomService = inject(RoomService);
  private router = inject(Router);
  private notification = inject(GlobalNotificationService);
  readonly isAdmin = inject(AuthService).isAdmin;
  readonly moduleTabs = ROOMS_TABS;

  readonly roomsResource = rxResource({ stream: () => this.roomService.getRooms() });

  readonly now = signal(Date.now());
  private clock = setInterval(() => this.now.set(Date.now()), CLOCK_TICK_MS);

  readonly cleaningRoom = signal<Room | null>(null);
  readonly cleaningOpen = signal(false);
  readonly cleaning = signal(false);

  readonly filters = FILTERS;
  readonly filter = signal<RoomFilter>('all');

  readonly activeRooms = computed(() => (this.roomsResource.value() ?? []).filter(room => room.isActive));

  readonly floors = computed<FloorGroup[]>(() => {
    const groups = new Map<number | null, Room[]>();
    const filter = this.filter();
    for (const room of this.activeRooms()) {
      if (filter !== 'all' && room.status !== filter) continue;
      const list = groups.get(room.floor) ?? [];
      list.push(room);
      groups.set(room.floor, list);
    }
    return [...groups].map(([floor, rooms]) => ({ floor, rooms }));
  });

  readonly counts = computed(() => {
    const rooms = this.activeRooms();
    const now = this.now();
    const stays = rooms.flatMap(room => (room.activeStay ? [room.activeStay] : []));
    const debtCents = stays.reduce((sum, stay) => sum + Math.max(0, Math.round(Number(stay.balance) * 100)), 0);
    return {
      all: rooms.length,
      FREE: rooms.filter(room => room.status === 'FREE').length,
      OCCUPIED: rooms.filter(room => room.status === 'OCCUPIED').length,
      CLEANING: rooms.filter(room => room.status === 'CLEANING').length,
      overdue: stays.filter(stay => new Date(stay.expectedCheckOut).getTime() < now).length,
      debt: debtCents / 100,
    } satisfies Record<RoomFilter, number> & { overdue: number; debt: number };
  });

  ngOnDestroy() {
    clearInterval(this.clock);
  }

  goToSettings() {
    void this.router.navigate(['/rooms/manage']);
  }

  select(room: Room) {
    switch (room.status) {
      case 'FREE':
        void this.router.navigate(['/rooms', room.id, 'check-in']);
        break;
      case 'OCCUPIED':
        if (room.activeStay) void this.router.navigate(['/rooms/stay', room.activeStay.stayId]);
        break;
      case 'CLEANING':
        this.cleaningRoom.set(room);
        this.cleaningOpen.set(true);
        break;
    }
  }

  markClean() {
    const room = this.cleaningRoom();
    if (!room || this.cleaning()) return;
    this.cleaning.set(true);
    this.roomService.markClean(room.id).subscribe({
      next: () => {
        this.cleaning.set(false);
        this.cleaningOpen.set(false);
        this.roomsResource.reload();
        this.notification.show(`Habitación ${room.number} lista`);
      },
      error: error => {
        this.cleaning.set(false);
        this.cleaningOpen.set(false);
        const resolved = resolveApiError(error, 'No se pudo marcar la habitación como lista.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.notification.show(resolved.message, 'error');
        this.roomsResource.reload();
      },
    });
  }
}
