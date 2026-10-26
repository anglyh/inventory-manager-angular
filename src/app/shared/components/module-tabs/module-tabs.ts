import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '@/auth/services/auth.service';
import { SegmentedControl, SegmentedOption } from '@/shared/components/segmented-control/segmented-control';

export interface ModuleTab {
  label: string;
  /** Absolute route of the tab, e.g. `/rooms/manage`. */
  link: string;
  adminOnly?: boolean;
}

/**
 * Tabs of a module (e.g. Habitaciones, Productos). Each tab is a route, so deep links and the
 * browser back button work. With a single visible tab nothing is rendered.
 */
@Component({
  selector: 'app-module-tabs',
  imports: [SegmentedControl],
  host: { class: 'block min-w-0 max-w-full', '[class.hidden]': 'options().length < 2' },
  template: `
    @if (options().length > 1) {
      <app-segmented-control
        class="max-w-full"
        surface="page"
        [label]="label()"
        [options]="options()"
        [value]="current()"
        (valueChange)="go($event)"
      />
    }
  `,
})
export class ModuleTabs {
  private router = inject(Router);
  private isAdmin = inject(AuthService).isAdmin;

  readonly tabs = input.required<readonly ModuleTab[]>();
  readonly label = input.required<string>();

  /** Hidden for non-admins: the route guard and the backend enforce the real permission. */
  readonly options = computed<SegmentedOption<string>[]>(() =>
    this.tabs()
      .filter(tab => this.isAdmin() || !tab.adminOnly)
      .map(tab => ({ value: tab.link, label: tab.label })),
  );

  private path = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.currentPath()),
    ),
    { initialValue: this.currentPath() },
  );

  readonly current = computed(() => this.tabs().find(tab => tab.link === this.path())?.link ?? null);

  go(link: string) {
    if (link !== this.path()) void this.router.navigateByUrl(link);
  }

  private currentPath() {
    return this.router.url.split(/[?#;]/)[0];
  }
}
