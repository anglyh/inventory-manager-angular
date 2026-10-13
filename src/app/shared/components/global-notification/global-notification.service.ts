import { Injectable, signal } from '@angular/core';

type NotificationType = 'success' | 'error';

type Notification = {
  visible: boolean;
  message: string;
  type: NotificationType;
}

@Injectable({providedIn: 'root'})
export class GlobalNotificationService {
  #hideTimeout: ReturnType<typeof setTimeout> | undefined;

  #state = signal<Notification>({
    visible: false,
    message: '',
    type: 'success'
  })
 
  state$ = this.#state.asReadonly();

  show(message: string, type: NotificationType = 'success', duration = 3000) {
    clearTimeout(this.#hideTimeout);
    this.#state.set({ visible: true, message, type })
    this.#hideTimeout = setTimeout(() => this.hide(), duration);
  }

  hide() {
    clearTimeout(this.#hideTimeout);
    this.#hideTimeout = undefined;
    this.#state.update(s => ({ ...s, visible: false }))
  }
}
