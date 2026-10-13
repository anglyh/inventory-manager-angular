import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLinkActive, RouterLink],
  templateUrl: './Sidebar.html',
})
export class Sidebar {
  itemSelected = output<void>();
  logoutRequested = output<void>();
}
