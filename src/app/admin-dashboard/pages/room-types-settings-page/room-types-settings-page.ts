import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerPlus, tablerTag } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { ModuleTabs } from '@/shared/components/module-tabs/module-tabs';
import { ROOMS_TABS } from '@/admin-dashboard/module-tabs';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';
import { RoomService } from '@/features/rooms/services/room.service';
import { RoomTypeTable } from '@/features/rooms/components/room-type-table/room-type-table';
import { RoomTypeForm, type RoomTypeSubmit } from '@/features/rooms/components/room-type-form/room-type-form';
import { StoreSettingsForm } from '@/features/rooms/components/store-settings-form/store-settings-form';
import { DeleteConfirmDialog } from '@/features/rooms/components/delete-confirm-dialog/delete-confirm-dialog';
import type { RoomType, UpdateStoreSettingsRequest } from '@/features/rooms/interfaces/room.interface';

/** Tipos de habitación con sus precios y las reglas de cobro comunes. */
@Component({
  selector: 'app-room-types-settings-page',
  imports: [Button, NgIcon, RoomTypeTable, RoomTypeForm, StoreSettingsForm, DeleteConfirmDialog, ModuleTabs],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerPlus, tablerTag })],
  templateUrl: './room-types-settings-page.html',
})
export class RoomTypesSettingsPage {
  private roomService = inject(RoomService);
  private router = inject(Router);
  private notification = inject(GlobalNotificationService);
  readonly moduleTabs = ROOMS_TABS;

  readonly typesResource = rxResource({ stream: () => this.roomService.getRoomTypes() });
  readonly settingsResource = rxResource({ stream: () => this.roomService.getSettings() });

  readonly roomTypes = computed(() => this.typesResource.value() ?? []);
  readonly loadError = computed(() => !!this.typesResource.error() || !!this.settingsResource.error());

  // Formulario
  readonly formOpen = signal(false);
  readonly editing = signal<RoomType | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // Acciones de fila
  readonly busyId = signal<string | null>(null);

  // Eliminación
  readonly deleteOpen = signal(false);
  readonly deleteTarget = signal<RoomType | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  // Reglas de cobro
  readonly settingsSaving = signal(false);

  retry() {
    this.typesResource.reload();
    this.settingsResource.reload();
  }

  openForm(type: RoomType | null) {
    this.editing.set(type);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  save(submit: RoomTypeSubmit) {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    const request: Observable<RoomType> =
      submit.id === null ? this.roomService.createRoomType(submit.body) : this.roomService.updateRoomType(submit.id, submit.body);
    request.subscribe({
      next: type => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.typesResource.reload();
        this.notification.show(submit.id === null ? `Tipo ${type.name} creado` : `Tipo ${type.name} actualizado`);
      },
      error: error => {
        this.saving.set(false);
        const resolved = resolveApiError(error, 'No se pudo guardar el tipo.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.formError.set(resolved.message);
      },
    });
  }

  toggleActive(type: RoomType) {
    if (this.busyId()) return;
    this.busyId.set(type.id);
    this.roomService.updateRoomType(type.id, { isActive: !type.isActive }).subscribe({
      next: updated => {
        this.busyId.set(null);
        this.typesResource.reload();
        this.notification.show(`Tipo ${updated.name} ${updated.isActive ? 'activado' : 'desactivado'}`);
      },
      error: error => {
        this.busyId.set(null);
        this.notifyError(error, 'No se pudo actualizar el tipo.');
      },
    });
  }

  askDelete(type: RoomType) {
    this.deleteTarget.set(type);
    this.deleteError.set(null);
    this.deleteOpen.set(true);
  }

  confirmDelete() {
    const type = this.deleteTarget();
    if (!type || this.deleting()) return;
    this.deleting.set(true);
    this.roomService.deleteRoomType(type.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.typesResource.reload();
        this.notification.show(`Tipo ${type.name} eliminado`);
      },
      error: error => {
        this.deleting.set(false);
        const resolved = resolveApiError(error, 'No se pudo eliminar el tipo.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.deleteError.set(resolved.message);
      },
    });
  }

  saveSettings(body: UpdateStoreSettingsRequest) {
    if (this.settingsSaving()) return;
    this.settingsSaving.set(true);
    this.roomService.updateSettings(body).subscribe({
      next: settings => {
        this.settingsSaving.set(false);
        this.settingsResource.set(settings);
        this.notification.show('Reglas de cobro guardadas');
      },
      error: error => {
        this.settingsSaving.set(false);
        this.notifyError(error, 'No se pudieron guardar las reglas de cobro.');
      },
    });
  }

  private notifyError(error: unknown, fallback: string) {
    const resolved = resolveApiError(error, fallback);
    if (resolved.redirect) void this.router.navigate([resolved.redirect]);
    else this.notification.show(resolved.message, 'error');
  }
}
