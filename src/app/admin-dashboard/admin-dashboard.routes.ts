import { Routes } from '@angular/router';
import { ProductsPage } from './pages/products-page/products-page';
import { PurchasesPage } from './pages/purchases-page/purchases-page';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';
import { AuthenticatedGuard } from '@/auth/guards/authenticated.guard';
import { NewPurchasePage } from './pages/new-purchase-page/new-purchase-page';
import { SalesPage } from './pages/sales-page/sales-page';
import { NewSalePage } from './pages/new-sale-page/new-sale-page';

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
        path: 'purchases/new',
        title: 'Nueva Compra',
        component: NewPurchasePage
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
        path: 'sales/new',
        title: 'Nueva Venta',
        component: NewSalePage
      },
      {
        path: 'sales',
        title: 'Ventas',
        component: SalesPage
      },
      {
        path: '**',
        redirectTo: 'products'
      }
    ]
  },
]

export default adminDashboardRoutes;