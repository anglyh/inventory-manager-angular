import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalNotification } from "./shared/components/global-notification/global-notification";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalNotification],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
