import { ProductWithStock } from '@/products/interfaces/product.interface';
import { Component, input } from '@angular/core';

@Component({
  selector: 'product-table',
  imports: [],
  templateUrl: './product-table.html',
})
export class ProductTable {
  products = input.required<ProductWithStock[]>();
}
