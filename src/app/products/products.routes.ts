import { Routes } from '@angular/router';
import { ProductPage } from './pages/product-page/product-page';

const productsRoutes: Routes = [
  {
    path: '',
    title: 'Productos',
    component: ProductPage,
  },
  {
    path: '**',
    redirectTo: ''
  }
]

export default productsRoutes;