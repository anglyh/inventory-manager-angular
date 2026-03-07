import { Routes } from '@angular/router';
import { PurchasePage } from './pages/purchase-page/purchase-page';

const purchasesRoutes: Routes = [
  {
    path: '',
    title: 'Compras',
    component: PurchasePage
  },
  {
    path: '**',
    redirectTo: ''
  }
]

export default purchasesRoutes;