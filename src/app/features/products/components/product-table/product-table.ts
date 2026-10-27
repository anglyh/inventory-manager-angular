import { ProductWithStock } from '@/features/products/interfaces/product.interface';
import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerDots } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';

interface StockStatus {
  label: string;
  class: string;
}

@Component({
  selector: 'product-table',
  imports: [DecimalPipe, NgIcon, Button],
  viewProviders: [provideIcons({ tablerDots })],
  templateUrl: './product-table.html',
})
export class ProductTable {
  products = input.required<ProductWithStock[]>();
  loading = input(false);
  /** Muestra la columna de acciones (solo ADMIN edita productos). */
  editable = input(true);

  readonly skeletonRows = [0, 1, 2, 3, 4, 5] as const;

  edit = output<ProductWithStock>();

  statusOf(product: ProductWithStock): StockStatus {
    if (!product.isActive) return { label: 'Inactivo', class: 'bg-base-200 text-neutral' };
    if (product.stock <= 0) return { label: 'Sin stock', class: 'bg-error-soft text-error' };
    if (product.stock < product.minStock) return { label: 'Reponer', class: 'bg-warning-soft text-warning' };
    return { label: 'En stock', class: 'bg-success-soft text-success' };
  }

  /** Los dropdown de daisyUI se cierran al perder el foco: tras elegir, se suelta. */
  blurActive() {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}
