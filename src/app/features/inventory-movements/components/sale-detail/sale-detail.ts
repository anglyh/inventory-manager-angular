import { Component, computed, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerTrash } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import type { PaymentMethod } from '../../interfaces/inventory-movement.interface';
import type { SaleCartItem } from '../../interfaces/sale.interface';

@Component({
  selector: 'sale-detail',
  imports: [NgIcon, Button],
  viewProviders: [provideIcons({ tablerTrash })],
  templateUrl: './sale-detail.html',
})
export class SaleDetail {
  products = input.required<SaleCartItem[]>();
  canSubmit = input(true);
  productDeleted = output<string>();
  quantityChanged = output<Pick<SaleCartItem, 'productId' | 'quantity'>>();

  paymentMethod = signal<PaymentMethod>('CASH');
  saleRequested = output<PaymentMethod>();
  
  total = computed(() =>
    this.products().reduce((sum, product) => sum + product.quantity * product.salePrice, 0),
  );

  increase(product: SaleCartItem) {
    if (product.quantity >= product.stock) return;

    this.quantityChanged.emit({ productId: product.productId, quantity: product.quantity + 1 });
  }

  decrease(product: SaleCartItem) {
    if (product.quantity <= 1) return;

    this.quantityChanged.emit({ productId: product.productId, quantity: product.quantity - 1 });
  }
}
