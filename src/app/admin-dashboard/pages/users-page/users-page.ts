import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { StoreUserService } from '@/features/users/services/store-user.service';
import { StoreUserForm } from '@/features/users/components/store-user-form/store-user-form';
import { StoreUserList, StoreUserActiveChange } from '@/features/users/components/store-user-list/store-user-list';
import type { CreateStoreUserRequest } from '@/features/users/interfaces/store-user.interface';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';

@Component({
  selector: 'app-users-page',
  imports: [StoreUserForm, StoreUserList],
  templateUrl: './users-page.html',
})
export class UsersPage {
  private router = inject(Router);
  private notification = inject(GlobalNotificationService);
  private storeUserService = inject(StoreUserService);

  usersResource = rxResource({ stream: () => this.storeUserService.list() });

  users = computed(() => (this.usersResource.hasValue() ? this.usersResource.value() : []));
  loadError = computed(() => (this.usersResource.error() ? 'No se pudieron cargar los usuarios.' : null));

  saving = signal(false);
  saveError = signal<string | null>(null);
  resetKey = signal(0);
  pendingId = signal<string | null>(null);

  create(body: CreateStoreUserRequest) {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);

    this.storeUserService.create(body).subscribe({
      next: user => {
        this.saving.set(false);
        this.resetKey.update(value => value + 1);
        this.usersResource.reload();
        this.notification.show(`${user.name} ya puede iniciar sesión`);
      },
      error: error => {
        this.saving.set(false);
        // 409 (email ya registrado) y 422 se muestran dentro del formulario.
        const resolved = resolveApiError(error, 'No se pudo crear el usuario.');
        if (resolved.redirect) {
          void this.router.navigate([resolved.redirect]);
          return;
        }
        this.saveError.set(resolved.message);
      },
    });
  }

  setActive({ user, active }: StoreUserActiveChange) {
    if (this.pendingId()) return;
    this.pendingId.set(user.id);

    this.storeUserService.update(user.id, { active }).subscribe({
      next: updated => {
        this.pendingId.set(null);
        // Se reemplaza solo la fila: la lista no parpadea ni pierde el orden.
        this.usersResource.update(list => list?.map(item => (item.id === updated.id ? updated : item)));
        this.notification.show(`${updated.name} ${updated.active ? 'activado' : 'desactivado'}`);
      },
      error: error => {
        this.pendingId.set(null);
        const resolved = resolveApiError(error, 'No se pudo actualizar el usuario.');
        if (resolved.redirect) {
          void this.router.navigate([resolved.redirect]);
          return;
        }
        this.notification.show(resolved.message, 'error');
        // 404: ya no es un empleado de esta tienda; se recarga para mostrar el estado real.
        this.usersResource.reload();
      },
    });
  }
}
