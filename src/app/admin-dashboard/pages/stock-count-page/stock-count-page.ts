import { Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerHistory } from '@ng-icons/tabler-icons';
import { StockCountForm } from '@/features/inventory-movements/components/stock-count-form/stock-count-form';
import { InventoryMovementService } from '@/features/inventory-movements/services/inventory-movement.service';
import type { StockCountRequest } from '@/features/inventory-movements/interfaces/other-movement-request.interface';
import { resolveApiError } from '@/features/inventory-movements/shared/movement-form-utils';
import { ProductService } from '@/features/products/services/product.service';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';

@Component({
  selector: 'app-stock-count-page',
  imports: [StockCountForm, RouterLink, NgIcon],
  viewProviders: [provideIcons({ tablerHistory })],
  templateUrl: './stock-count-page.html',
  host: { class: 'flex min-h-full flex-col gap-4' },
})
export class StockCountPage {
  private router = inject(Router);
  private productService = inject(ProductService);
  private inventoryMovementService = inject(InventoryMovementService);
  private notificationService = inject(GlobalNotificationService);

  saving = signal(false);
  private form = viewChild(StockCountForm);

  productsResource = rxResource({
    stream: () => this.productService.listProductOptions(),
  });

  registerCount(count: StockCountRequest) {
    this.saving.set(true);
    this.inventoryMovementService.registerStockCount(count).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.show('Conteo registrado', 'success');
        this.form()?.reset();
        this.productsResource.reload();
      },
      error: error => {
        this.saving.set(false);
        const { message, redirect } = resolveApiError(error, 'No se pudo registrar el conteo. Intenta nuevamente.');
        if (redirect) {
          void this.router.navigate([redirect]);
          return;
        }
        this.notificationService.show(message, 'error');
      },
    });
  }
}
