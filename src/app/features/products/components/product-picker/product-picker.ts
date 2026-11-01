import { Component, input, output } from '@angular/core';
import { ProductOption } from '@/features/products/interfaces/product.interface';
import { ProductCard } from "../product-card/product-card";
import type { SaleCartItem } from '@/features/inventory-movements/interfaces/sale.interface';

@Component({
  selector: 'product-picker',
  imports: [ProductCard],
  templateUrl: './product-picker.html',
})
export class ProductPicker {
  products = input.required<ProductOption[]>();
  selectedProducts = input<SaleCartItem[]>([]);
  productSelected = output<ProductOption>();

  isSelected(productId: string) {
    return this.selectedProducts().some(item => item.productId === productId)
  }
}
