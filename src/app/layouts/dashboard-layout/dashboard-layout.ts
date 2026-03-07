import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet, RouterLinkActive, ActivatedRoute, RouteConfigLoadEnd, NavigationEnd } from '@angular/router';
import { filter, map, startWith, tap, withLatestFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {
  private router = inject(Router)
  private activatedRoute = inject(ActivatedRoute)

  currentRouteTitle = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let currentRoute = this.activatedRoute.root

        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild
        }

        return (
          currentRoute.snapshot.routeConfig?.title as string ?? 'Dashboard'
        )
      }),
      startWith('Dashboard')
    )
  )
  constructor() {
    this.currentRouteTitle()
  }

}
