import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProductOption } from 'src/app/features/products/interfaces/product.interface';

@Component({
  selector: 'product-card',
  imports: [DecimalPipe],
  templateUrl: './product-card.html',
})
export class ProductCard {
  product = input.required<ProductOption>();
  selected = input(false);
}
