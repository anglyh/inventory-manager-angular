import { RedirectFunction, Router, Routes } from '@angular/router';
import { ProductsPage } from './pages/products-page/products-page';
import { PurchasesPage } from './pages/purchases-page/purchases-page';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';
import { inject } from '@angular/core';
import { AuthenticatedGuard } from '@/auth/guards/authenticated.guard';
import { AdminGuard } from '@/auth/guards/admin.guard';
import { AuthService } from '@/auth/services/auth.service';
import { SalesPage } from './pages/sales-page/sales-page';
import { ReportsPage } from '@/admin-dashboard/pages/reports-page/reports-page';
import { CatalogsPage } from './pages/catalogs-page/catalogs-page';
import { UsersPage } from './pages/users-page/users-page';
import { CashRegisterPage } from './pages/cash-register-page/cash-register-page';
import { CashRegisterHistoryPage } from './pages/cash-register-history-page/cash-register-history-page';
import { CashRegisterDetailPage } from './pages/cash-register-detail-page/cash-register-detail-page';
import { MovementsHistoryPage } from './pages/movements-history-page/movements-history-page';

/** El viejo `?tab=suppliers` de Catálogos lleva a su pestaña; el resto, a Categorías. */
const catalogsRedirect: RedirectFunction = ({ queryParams }) =>
  inject(Router).parseUrl(queryParams['tab'] === 'suppliers' ? '/products/suppliers' : '/products/categories');

const adminDashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardLayout,
    canMatch: [
      AuthenticatedGuard
    ],
    children: [
      // Productos: el listado y, para el admin, sus catálogos como pestañas.
      {
        path: 'products/categories',
        canMatch: [AdminGuard],
        title: 'Categorías',
        data: { catalog: 'categories' },
        component: CatalogsPage,
      },
      {
        path: 'products/suppliers',
        canMatch: [AdminGuard],
        title: 'Proveedores',
        data: { catalog: 'suppliers' },
        component: CatalogsPage,
      },
      {
        path: 'products',
        title: 'Productos',
        component: ProductsPage,
      },
      {
        path: 'team',
        canMatch: [AdminGuard],
        title: 'Equipo',
        component: UsersPage,
      },
      // Rutas anteriores (incluida la vieja Configuración): siguen funcionando si alguien las tenía guardadas.
      { path: 'settings', pathMatch: 'full', redirectTo: '/rooms/manage' },
      { path: 'settings/rooms', pathMatch: 'full', redirectTo: '/rooms/manage' },
      { path: 'settings/room-types', pathMatch: 'full', redirectTo: '/rooms/types' },
      { path: 'settings/catalogs', pathMatch: 'full', redirectTo: catalogsRedirect },
      { path: 'catalogs', pathMatch: 'full', redirectTo: catalogsRedirect },
      { path: 'categories', pathMatch: 'full', redirectTo: '/products/categories' },
      { path: 'suppliers', pathMatch: 'full', redirectTo: '/products/suppliers' },
      { path: 'settings/initial-load', pathMatch: 'full', redirectTo: '/initial-load' },
      { path: 'settings/users', pathMatch: 'full', redirectTo: '/team' },
      { path: 'users', pathMatch: 'full', redirectTo: '/team' },
      { path: 'adjustments', redirectTo: () => '/losses' },
      {
        path: 'purchases/new', redirectTo: 'purchases', pathMatch: 'full'
      },
      {
        path: 'purchases',
        canMatch: [AdminGuard],
        title: 'Compras',
        component: PurchasesPage
      },
      // {
      //   path: 'purchases/:id',
      //   component: PurchasesPage
      // },
      {
        path: 'sales/new', redirectTo: 'sales', pathMatch: 'full'
      },
      {
        path: 'sales',
        title: 'Punto de venta',
        component: SalesPage
      },
      { path: 'cash-register/history', canMatch: [AdminGuard], title: 'Historial de cajas', component: CashRegisterHistoryPage },
      // Después de 'cash-register/history' para que ':id' no la capture.
      { path: 'cash-register/:id', canMatch: [AdminGuard], title: 'Detalle de caja', component: CashRegisterDetailPage },
      { path: 'cash-register', title: 'Caja', component: CashRegisterPage },
      { path: 'movements', title: 'Historial de movimientos', component: MovementsHistoryPage },
      // Gastos: la lista del período y su catálogo de categorías como pestañas (solo admin).
      {
        path: 'expenses/categories',
        canMatch: [AdminGuard],
        title: 'Categorías de gastos',
        loadComponent: () =>
          import('./pages/expense-categories-page/expense-categories-page').then(m => m.ExpenseCategoriesPage),
      },
      {
        path: 'expenses',
        canMatch: [AdminGuard],
        title: 'Gastos',
        loadComponent: () => import('./pages/expenses-page/expenses-page').then(m => m.ExpensesPage),
      },
      {
        path: 'losses',
        title: 'Mermas',
        loadComponent: () => import('./pages/losses-page/losses-page').then(m => m.LossesPage),
      },
      {
        path: 'stock-count',
        canMatch: [AdminGuard],
        title: 'Conteo físico',
        loadComponent: () => import('./pages/stock-count-page/stock-count-page').then(m => m.StockCountPage),
      },
      {
        path: 'initial-load',
        canMatch: [AdminGuard],
        title: 'Stock inicial',
        loadComponent: () => import('./pages/initial-load-page/initial-load-page').then(m => m.InitialLoadPage),
      },
      // Habitaciones: tablero y, para el admin, su gestión como pestañas.
      // Antes de 'rooms/stay/:id' y 'rooms/:roomId/check-in' para que ningún parámetro las capture.
      {
        path: 'rooms/manage',
        canMatch: [AdminGuard],
        title: 'Habitaciones',
        loadComponent: () => import('./pages/rooms-settings-page/rooms-settings-page').then(m => m.RoomsSettingsPage),
      },
      {
        path: 'rooms/types',
        canMatch: [AdminGuard],
        title: 'Tipos y precios',
        loadComponent: () =>
          import('./pages/room-types-settings-page/room-types-settings-page').then(m => m.RoomTypesSettingsPage),
      },
      {
        path: 'rooms/stay/:id',
        title: 'Estadía',
        loadComponent: () => import('./pages/stay-detail-page/stay-detail-page').then(m => m.StayDetailPage),
      },
      {
        path: 'rooms/:roomId/check-in',
        title: 'Check-in',
        loadComponent: () => import('./pages/stay-check-in-page/stay-check-in-page').then(m => m.StayCheckInPage),
      },
      {
        path: 'rooms',
        title: 'Habitaciones',
        loadComponent: () => import('./pages/rooms-page/rooms-page').then(m => m.RoomsPage),
      },
      {
        path: 'stays',
        title: 'Registro de huéspedes',
        loadComponent: () => import('./pages/guest-register-page/guest-register-page').then(m => m.GuestRegisterPage),
      },
      {
        path: 'reports',
        canMatch: [AdminGuard],
        title: 'Reportes',
        component: ReportsPage
      },
      {
        path: '**',
        // Cada rol cae en su pantalla principal.
        redirectTo: () => (inject(AuthService).isAdmin() ? 'reports' : 'sales')
      }
    ]
  },
]

export default adminDashboardRoutes;
