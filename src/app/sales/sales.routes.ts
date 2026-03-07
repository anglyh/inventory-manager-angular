import { Routes } from '@angular/router';
import { SalePage } from './pages/sale-page/sale-page';

const salesRoutes: Routes = [
  {
    path: '',
    title: 'Ventas',
    component: SalePage,
  },
  {
    path: '**',
    redirectTo: ''
  }
]

export default salesRoutes;