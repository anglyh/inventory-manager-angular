import { AuthService } from '@/auth/services/auth.service';
import { AfterViewInit, Component, computed, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerArrowLeft, tablerChevronDown, tablerLogout, tablerUsers } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';

interface DashboardHeaderAction {
  label: string;
  link: string;
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterOutlet, Sidebar, NgIcon, Button],
  viewProviders: [provideIcons({ tablerArrowLeft, tablerChevronDown, tablerLogout, tablerUsers })],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout implements AfterViewInit {
  private drawerToggle = viewChild<ElementRef<HTMLInputElement>>('drawerToggle')

  private router = inject(Router)
  private authService = inject(AuthService)
  private destroyRef = inject(DestroyRef)

  /** Título y, si la ruta declara `data: { back }`, a dónde lleva la flecha de volver. */
  private currentPage = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.#pageFromRoute()),
      startWith(this.#pageFromRoute()),
    ),
    { requireSync: true },
  )

  currentRouteTitle = computed(() => this.currentPage().title)
  backLink = computed(() => this.currentPage().back)

  goBack() {
    const back = this.backLink()
    if (back) void this.router.navigateByUrl(back)
  }

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

  readonly isAdmin = this.authService.isAdmin
  readonly userName = computed(() => this.authService.user()?.name?.trim() || 'Mi cuenta')
  readonly userInitial = computed(() => this.userName().charAt(0).toUpperCase())
  readonly roleLabel = computed(() => (this.isAdmin() ? 'Administrador' : 'Empleado'))

  /** Los dropdown de daisyUI se cierran al perder el foco: tras elegir, se suelta. */
  blurActive() {
    (document.activeElement as HTMLElement | null)?.blur()
  }

  logout() {
    this.authService.logout()
    this.router.navigateByUrl('/')
  }

  #pageFromRoute(): { title: string; back: string | null } {
    // El snapshot del router existe siempre; el de ActivatedRoute no antes de la primera navegación.
    let route = this.router.routerState.snapshot.root
    while (route.firstChild) {
      route = route.firstChild
    }
    const { routeConfig, data } = route
    return {
      title: (routeConfig?.title as string) ?? 'Inicio',
      back: typeof data['back'] === 'string' ? data['back'] : null,
    }
  }

  #headerActionFromUrl(): DashboardHeaderAction | null {
    return null;
  }
}
