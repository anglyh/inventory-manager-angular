import { Component, input } from '@angular/core';
import { ProductOption } from 'src/app/features/products/interfaces/product.interface';

@Component({
  selector: 'product-card',
  imports: [],
  templateUrl: './product-card.html',
})
export class ProductCard {
  product = input.required<ProductOption>();
  selected = input(false);
}
