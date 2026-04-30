import { ProductWithStock } from '@/products/interfaces/product.interface';
import { Component, input, output } from '@angular/core';

import { Button } from 'src/app/shared/components/button/button';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'product-table',
  imports: [Button, DecimalPipe],
  templateUrl: './product-table.html',

})
export class ProductTable {
  products = input.required<ProductWithStock[]>();
  loading = input(false);

  readonly skeletonRows = [0, 1, 2, 3, 4, 5] as const;

  edit = output<ProductWithStock>();
}
