import { Button } from '@/shared/components/button/button';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerArrowLeft } from '@ng-icons/tabler-icons';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';
import { RoomService } from '@/features/rooms/services/room.service';
import { StayService } from '@/features/rooms/services/stay.service';
import {
  StayCheckInForm,
  type GuestLookupRequest,
  type GuestLookupResult,
} from '@/features/rooms/components/stay-check-in-form/stay-check-in-form';
import type { CheckInRequest } from '@/features/rooms/interfaces/stay.interface';

@Component({
  selector: 'app-stay-check-in-page',
  imports: [Button, RouterLink, NgIcon, StayCheckInForm],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerArrowLeft })],
  templateUrl: './stay-check-in-page.html',
})
export class StayCheckInPage {
  private roomService = inject(RoomService);
  private stayService = inject(StayService);
  private router = inject(Router);
  private notification = inject(GlobalNotificationService);

  readonly roomId = toSignal(inject(ActivatedRoute).paramMap.pipe(map(params => params.get('roomId') ?? '')), {
    requireSync: true,
  });

  readonly dataResource = rxResource({
    params: () => this.roomId(),
    stream: () =>
      forkJoin({
        rooms: this.roomService.getRooms(),
        roomTypes: this.roomService.getRoomTypes(),
        settings: this.roomService.getSettings(),
      }),
  });

  readonly context = computed(() => {
    const data = this.dataResource.value();
    if (!data) return null;
    const room = data.rooms.find(item => item.id === this.roomId());
    const roomType = room && data.roomTypes.find(type => type.id === room.roomTypeId);
    if (!room || !roomType) return { missing: true as const };
    return { missing: false as const, room, roomType, settings: data.settings };
  });

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly lookingUp = signal<number | null>(null);
  readonly foundGuest = signal<GuestLookupResult | null>(null);

  lookupGuest(request: GuestLookupRequest) {
    this.lookingUp.set(request.index);
    this.stayService.findGuest(request.documentType, request.documentNumber).subscribe({
      next: guest => {
        this.lookingUp.set(null);
        if (guest) this.foundGuest.set({ index: request.index, guest });
      },
      // Si la búsqueda falla, se completa a mano: no hace falta interrumpir.
      error: () => this.lookingUp.set(null),
    });
  }

  checkIn(body: CheckInRequest) {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.stayService.checkIn(body).subscribe({
      next: stay => {
        this.saving.set(false);
        this.notification.show(`Ingreso registrado en la ${stay.roomNumber}`);
        void this.router.navigate(['/rooms/stay', stay.id]);
      },
      error: error => {
        this.saving.set(false);
        const resolved = resolveApiError(error, 'No se pudo registrar el ingreso.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.error.set(resolved.message);
      },
    });
  }

  cancel() {
    void this.router.navigate(['/rooms']);
  }
}
