import { Routes } from '@angular/router';
import { ProductsPage } from './pages/products-page/products-page';
import { PurchasesPage } from './pages/purchases-page/purchases-page';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';
import { AuthenticatedGuard } from '@/auth/guards/authenticated.guard';
import { SalesPage } from './pages/sales-page/sales-page';
import { ReportsPage } from '@/admin-dashboard/pages/reports-page/reports-page';
import { CatalogsPage } from './pages/catalogs-page/catalogs-page';
import { CashRegisterPage } from './pages/cash-register-page/cash-register-page';
import { CashRegisterHistoryPage } from './pages/cash-register-history-page/cash-register-history-page';
import { CashRegisterDetailPage } from './pages/cash-register-detail-page/cash-register-detail-page';
import { MovementsHistoryPage } from './pages/movements-history-page/movements-history-page';

const adminDashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardLayout,
    canMatch: [
      AuthenticatedGuard
    ],
    children: [
      {
        path: 'products',
        title: 'Productos',
        component: ProductsPage,
      },
      {
        path: 'catalogs',
        title: 'Catálogos',
        component: CatalogsPage,
      },
      // Rutas anteriores: siguen funcionando si alguien las tenía guardadas.
      { path: 'categories', redirectTo: () => '/catalogs?tab=categories' },
      { path: 'suppliers', redirectTo: () => '/catalogs?tab=suppliers' },
      { path: 'adjustments', redirectTo: () => '/losses' },
      {
        path: 'purchases/new', redirectTo: 'purchases', pathMatch: 'full'
      },
      {
        path: 'purchases',
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
      { path: 'cash-register/history', title: 'Historial de cajas', component: CashRegisterHistoryPage },
      // Después de 'cash-register/history' para que ':id' no la capture.
      { path: 'cash-register/:id', title: 'Detalle de caja', component: CashRegisterDetailPage },
      { path: 'cash-register', title: 'Caja', component: CashRegisterPage },
      { path: 'movements', title: 'Historial de movimientos', component: MovementsHistoryPage },
      {
        path: 'losses',
        title: 'Mermas',
        loadComponent: () => import('./pages/losses-page/losses-page').then(m => m.LossesPage),
      },
      {
        path: 'stock-count',
        title: 'Conteo físico',
        loadComponent: () => import('./pages/stock-count-page/stock-count-page').then(m => m.StockCountPage),
      },
      {
        path: 'initial-load',
        title: 'Carga inicial',
        loadComponent: () => import('./pages/initial-load-page/initial-load-page').then(m => m.InitialLoadPage),
      },
      {
        path: 'reports',
        title: 'Reportes',
        component: ReportsPage
      },
      {
        path: '**',
        redirectTo: 'reports'
      }
    ]
  },
]

export default adminDashboardRoutes;
