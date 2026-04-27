import { AuthService } from '@/auth/services/auth.service';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet, RouterLinkActive, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterOutlet, RouterLinkActive, Button],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {
  private router = inject(Router)
  private activatedRoute = inject(ActivatedRoute)
  private authService = inject(AuthService)

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

  logout() {
    this.authService.logout()
    this.router.navigateByUrl('/')
  }
}
