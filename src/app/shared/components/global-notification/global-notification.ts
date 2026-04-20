import { Component, inject } from '@angular/core';
import { GlobalNotificationService } from './global-notification.service';

@Component({
  selector: 'app-global-notification',
  imports: [],
  templateUrl: './global-notification.html',
})
export class GlobalNotification {
  state = inject(GlobalNotificationService).state$;
}
