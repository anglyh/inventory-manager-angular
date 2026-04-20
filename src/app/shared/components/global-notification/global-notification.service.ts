import { Injectable, signal } from '@angular/core';

type NotificationType = 'success' | 'error';

type Notification = {
  visible: boolean;
  message: string;
  type: NotificationType;
}

@Injectable({providedIn: 'root'})
export class GlobalNotificationService {
  #state = signal<Notification>({
    visible: false,
    message: '',
    type: 'success'
  })

  state$ = this.#state.asReadonly();

  show(message: string, type: NotificationType = 'success', duration = 4000) {
    this.#state.set({ visible: true, message, type })
    setTimeout(() => this.hide(), duration);
  }

  hide() {
    this.#state.update(s => ({ ...s, visible: false }))
  }
}