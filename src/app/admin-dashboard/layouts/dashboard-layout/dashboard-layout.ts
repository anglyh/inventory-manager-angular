import { AuthService } from '@/auth/services/auth.service';
import { AfterViewInit, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet, RouterLinkActive, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

interface DashboardHeaderAction {
  label: string;
  link: string;
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout implements AfterViewInit {
  private drawerToggle = viewChild<ElementRef<HTMLInputElement>>('drawerToggle')

  private router = inject(Router)
  private activatedRoute = inject(ActivatedRoute)
  private authService = inject(AuthService)
  private destroyRef = inject(DestroyRef)

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

  /** Botón contextual en el header (p. ej. nueva venta / nueva compra en listados). */
  headerPrimaryAction = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.#headerActionFromUrl()),
    ),
    { initialValue: this.#headerActionFromUrl() },
  )

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeDrawerIfMobile()
      })
  }

  ngAfterViewInit(): void {
    this.setDrawerDefaultState()
  }

  private setDrawerDefaultState() {
    if (typeof window === 'undefined') return

    const input = this.drawerToggle()?.nativeElement
    if (!input || input.type !== 'checkbox') return

    // Tailwind `lg` breakpoint = 1024px (min-width)
    input.checked = window.matchMedia('(min-width: 1024px)').matches
  }

  closeDrawerIfMobile() {
    if (typeof window === 'undefined') return

    // Tailwind `lg` breakpoint = 1024px (min-width)
    if (window.matchMedia('(min-width: 1024px)').matches) return

    const input = this.drawerToggle()?.nativeElement
    if (!input) return
    if (input.type === 'checkbox') input.checked = false
  }

  logout() {
    this.authService.logout()
    this.router.navigateByUrl('/')
  }

  #headerActionFromUrl(): DashboardHeaderAction | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    if (path === '/sales') {
      return { label: 'Nueva venta', link: '/sales/new' };
    }
    if (path === '/purchases') {
      return { label: 'Nueva compra', link: '/purchases/new' };
    }
    return null;
  }
}
