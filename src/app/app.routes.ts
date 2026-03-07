import { Routes } from '@angular/router';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';
import { NotAuthenticatedGuard } from './auth/guards/not-authenticated.guard';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import("./auth/auth.routes"),
    canMatch: [NotAuthenticatedGuard]
  },
  {
    path: '',
    component: DashboardLayout,
    canMatch: [AuthenticatedGuard],
    children: [
      {
        path: 'products',
        loadChildren: () => import('./products/products.routes'),
      },
      {
        path: 'purchases',
        loadChildren: () => import('./purchases/purchases.routes'),
      },
      {
        path: 'sales',
        loadChildren: () => import('./sales/sales.routes'),
      },
      {
        path: '**',
        redirectTo: 'products'
      }
    ]
  },
  ];
