import { Component, computed, inject, linkedSignal, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerAddressBook,
  tablerArrowsExchange,
  tablerBed,
  tablerBuildingWarehouse,
  tablerCashRegister,
  tablerChartBar,
  tablerChevronRight,
  tablerClipboardCheck,
  tablerPackage,
  tablerReceipt,
  tablerShoppingCart,
  tablerTrendingDown,
  tablerTruckDelivery,
  tablerUpload,
} from '@ng-icons/tabler-icons';
import { AuthService } from '@/auth/services/auth.service';

interface NavItem {
  label: string;
  link: string;
  icon: string;
  /** `subset`: también queda activo en sus subrutas (p. ej. /cash-register/history). */
  match?: 'exact' | 'subset';
  adminOnly?: boolean;
}

interface NavSection {
  /** Sin título: va arriba, es lo común a todo el negocio. */
  title?: string;
  items: NavItem[];
}

/** Agrupado por área del negocio: cada pantalla está en un solo lugar. */
const SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Resumen', link: '/reports', icon: 'tablerChartBar', adminOnly: true },
      { label: 'Caja', link: '/cash-register', icon: 'tablerCashRegister', match: 'subset' },
      { label: 'Gastos', link: '/expenses', icon: 'tablerReceipt', match: 'subset', adminOnly: true },
    ],
  },
  {
    title: 'Hostal',
    items: [
      { label: 'Habitaciones', link: '/rooms', icon: 'tablerBed', match: 'subset' },
      { label: 'Huéspedes', link: '/stays', icon: 'tablerAddressBook' },
    ],
  },
  {
    title: 'Tienda',
    items: [
      { label: 'Punto de venta', link: '/sales', icon: 'tablerShoppingCart' },
      { label: 'Productos', link: '/products', icon: 'tablerPackage', match: 'subset' },
    ],
  },
];

/** Las formas en que se mueve el stock: se usan menos que vender, van plegadas. */
const INVENTORY: NavItem[] = [
  { label: 'Compras', link: '/purchases', icon: 'tablerTruckDelivery', adminOnly: true },
  { label: 'Mermas', link: '/losses', icon: 'tablerTrendingDown' },
  { label: 'Conteo físico', link: '/stock-count', icon: 'tablerClipboardCheck', adminOnly: true },
  { label: 'Movimientos', link: '/movements', icon: 'tablerArrowsExchange' },
  { label: 'Stock inicial', link: '/initial-load', icon: 'tablerUpload', adminOnly: true },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLinkActive, RouterLink, NgIcon, NgTemplateOutlet],
  viewProviders: [
    provideIcons({
      tablerAddressBook,
      tablerArrowsExchange,
      tablerBed,
      tablerBuildingWarehouse,
      tablerCashRegister,
      tablerChartBar,
      tablerChevronRight,
      tablerClipboardCheck,
      tablerPackage,
      tablerReceipt,
      tablerShoppingCart,
      tablerTrendingDown,
      tablerTruckDelivery,
      tablerUpload,
    }),
  ],
  templateUrl: './Sidebar.html',
})
export class Sidebar {
  /** Solo oculta entradas: el permiso real lo validan el guard y el backend. */
  readonly isAdmin = inject(AuthService).isAdmin;
  private router = inject(Router);

  itemSelected = output<void>();

  readonly sections = computed(() =>
    SECTIONS.map(section => ({ ...section, items: this.visible(section.items) })).filter(section => section.items.length),
  );
  readonly inventory = computed(() => this.visible(INVENTORY));

  private url = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Inventario se abre solo si estás en una de sus pantallas; después lo controla el usuario. */
  readonly inventoryActive = computed(() => INVENTORY.some(item => this.url().startsWith(item.link)));
  readonly inventoryOpen = linkedSignal(() => this.inventoryActive());

  private visible(items: NavItem[]) {
    return this.isAdmin() ? items : items.filter(item => !item.adminOnly);
  }
}
