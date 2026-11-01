import { Component, input, output } from '@angular/core';
import type { StoreUser } from '../../interfaces/store-user.interface';

export interface StoreUserActiveChange {
  user: StoreUser;
  active: boolean;
}

@Component({
  selector: 'store-user-list',
  templateUrl: './store-user-list.html',
})
export class StoreUserList {
  users = input<StoreUser[]>([]);
  loading = input(false);
  error = input<string | null>(null);
  /** Usuario cuyo cambio de estado se está guardando. */
  pendingId = input<string | null>(null);
  activeChange = output<StoreUserActiveChange>();
}
