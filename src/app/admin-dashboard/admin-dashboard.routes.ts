import { Routes } from '@angular/router';
import { ProductsPage } from './pages/products-page/products-page';
import { PurchasesPage } from './pages/purchases-page/purchases-page';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';
import { AuthenticatedGuard } from '@/auth/guards/authenticated.guard';

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
        path: 'purchases',
        title: 'Compras',
        component: PurchasesPage
      },
      {
        path: '**',
        redirectTo: 'products'
      }
    ]
  },
]

export default adminDashboardRoutes;