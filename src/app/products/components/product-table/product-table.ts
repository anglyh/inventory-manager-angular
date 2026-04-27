import { ProductWithStock } from '@/products/interfaces/product.interface';
import { Component, input, output } from '@angular/core';

import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'product-table',
  imports: [Button],
  templateUrl: './product-table.html',

})
export class ProductTable {
  products = input.required<ProductWithStock[]>();
  
  edit = output<ProductWithStock>();
}
