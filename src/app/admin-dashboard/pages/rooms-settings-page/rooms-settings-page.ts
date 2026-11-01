import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerDoor, tablerPlus } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { ModuleTabs } from '@/shared/components/module-tabs/module-tabs';
import { ROOMS_TABS } from '@/admin-dashboard/module-tabs';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';
import { RoomService } from '@/features/rooms/services/room.service';
import { RoomTable } from '@/features/rooms/components/room-table/room-table';
import { RoomForm, type RoomSubmit } from '@/features/rooms/components/room-form/room-form';
import { DeleteConfirmDialog } from '@/features/rooms/components/delete-confirm-dialog/delete-confirm-dialog';
import type { Room } from '@/features/rooms/interfaces/room.interface';

/** Alta, edición, activación y baja de habitaciones. Los tipos y precios viven en su propia página. */
@Component({
  selector: 'app-rooms-settings-page',
  imports: [Button, NgIcon, RoomTable, RoomForm, DeleteConfirmDialog, ModuleTabs],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerDoor, tablerPlus })],
  templateUrl: './rooms-settings-page.html',
})
export class RoomsSettingsPage {
  private roomService = inject(RoomService);
  private router = inject(Router);
  private notification = inject(GlobalNotificationService);
  readonly moduleTabs = ROOMS_TABS;

  readonly typesResource = rxResource({ stream: () => this.roomService.getRoomTypes() });
  readonly roomsResource = rxResource({ stream: () => this.roomService.getRooms() });

  readonly roomTypes = computed(() => this.typesResource.value() ?? []);
  readonly rooms = computed(() => this.roomsResource.value() ?? []);
  /** Sin tipos activos no hay con qué crear una habitación. */
  readonly canCreate = computed(() => this.roomTypes().some(type => type.isActive));
  readonly loadError = computed(() => !!this.typesResource.error() || !!this.roomsResource.error());

  // Formulario
  readonly formOpen = signal(false);
  readonly editing = signal<Room | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // Acciones de fila
  readonly busyId = signal<string | null>(null);

  // Eliminación
  readonly deleteOpen = signal(false);
  readonly deleteTarget = signal<Room | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  /** La API rechazó la baja por historial: se ofrece desactivar. */
  readonly offerDeactivate = signal(false);

  retry() {
    this.typesResource.reload();
    this.roomsResource.reload();
  }

  goToTypes() {
    void this.router.navigate(['/rooms/types']);
  }

  openForm(room: Room | null) {
    this.editing.set(room);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  save(submit: RoomSubmit) {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    const request: Observable<Room> =
      submit.id === null ? this.roomService.createRoom(submit.body) : this.roomService.updateRoom(submit.id, submit.body);
    request.subscribe({
      next: room => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reloadAll();
        this.notification.show(submit.id === null ? `Habitación ${room.number} creada` : `Habitación ${room.number} actualizada`);
      },
      error: error => {
        this.saving.set(false);
        const resolved = resolveApiError(error, 'No se pudo guardar la habitación.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.formError.set(resolved.message);
      },
    });
  }

  toggleActive(room: Room) {
    if (this.busyId()) return;
    this.busyId.set(room.id);
    this.roomService.updateRoom(room.id, { isActive: !room.isActive }).subscribe({
      next: updated => {
        this.busyId.set(null);
        this.reloadAll();
        this.notification.show(`Habitación ${updated.number} ${updated.isActive ? 'activada' : 'desactivada'}`);
      },
      error: error => {
        this.busyId.set(null);
        this.notifyError(error, 'No se pudo actualizar la habitación.');
      },
    });
  }

  askDelete(room: Room) {
    this.deleteTarget.set(room);
    this.deleteError.set(null);
    this.offerDeactivate.set(false);
    this.deleteOpen.set(true);
  }

  confirmDelete() {
    const room = this.deleteTarget();
    if (!room || this.deleting()) return;
    this.deleting.set(true);
    this.roomService.deleteRoom(room.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.reloadAll();
        this.notification.show(`Habitación ${room.number} eliminada`);
      },
      error: error => {
        this.deleting.set(false);
        const resolved = resolveApiError(error, 'No se pudo eliminar la habitación.');
        if (resolved.redirect) {
          void this.router.navigate([resolved.redirect]);
          return;
        }
        this.deleteError.set(resolved.message);
        this.offerDeactivate.set(isConflict(error) && room.isActive);
      },
    });
  }

  /** Alternativa a la baja cuando la habitación ya tiene estadías registradas. */
  deactivateInstead() {
    const room = this.deleteTarget();
    if (!room || this.deleting()) return;
    this.deleting.set(true);
    this.roomService.updateRoom(room.id, { isActive: false }).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.reloadAll();
        this.notification.show(`Habitación ${room.number} desactivada`);
      },
      error: error => {
        this.deleting.set(false);
        this.offerDeactivate.set(false);
        const resolved = resolveApiError(error, 'No se pudo desactivar la habitación.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.deleteError.set(resolved.message);
      },
    });
  }

  /** El conteo de habitaciones por tipo también cambia. */
  private reloadAll() {
    this.roomsResource.reload();
    this.typesResource.reload();
  }

  private notifyError(error: unknown, fallback: string) {
    const resolved = resolveApiError(error, fallback);
    if (resolved.redirect) void this.router.navigate([resolved.redirect]);
    else this.notification.show(resolved.message, 'error');
  }
}

function isConflict(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 409;
}
