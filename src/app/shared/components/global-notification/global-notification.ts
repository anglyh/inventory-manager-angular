import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerCircleCheck } from '@ng-icons/tabler-icons';
import { GlobalNotificationService } from './global-notification.service';

@Component({
  selector: 'app-global-notification',
  imports: [NgIcon],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerCircleCheck })],
  templateUrl: './global-notification.html',
})
export class GlobalNotification {
  state = inject(GlobalNotificationService).state$;
}
