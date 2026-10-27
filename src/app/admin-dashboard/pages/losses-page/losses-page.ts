import { Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LossForm } from '@/features/inventory-movements/components/loss-form/loss-form';
import { InventoryMovementService } from '@/features/inventory-movements/services/inventory-movement.service';
import type { CreateLossRequest } from '@/features/inventory-movements/interfaces/other-movement-request.interface';
import { resolveApiError } from '@/features/inventory-movements/shared/movement-form-utils';
import { ProductService } from '@/features/products/services/product.service';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { Button } from '@/shared/components/button/button';

@Component({
  selector: 'app-losses-page',
  imports: [LossForm, Button],
  templateUrl: './losses-page.html',
  host: { class: 'flex min-h-full flex-col gap-4' },
})
export class LossesPage {
  private router = inject(Router);
  private productService = inject(ProductService);
  private inventoryMovementService = inject(InventoryMovementService);
  private notificationService = inject(GlobalNotificationService);

  saving = signal(false);
  private form = viewChild(LossForm);

  productsResource = rxResource({
    stream: () => this.productService.listProductOptions(),
  });

  registerLoss(loss: CreateLossRequest) {
    this.saving.set(true);
    this.inventoryMovementService.registerLoss(loss).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.show('Merma registrada', 'success');
        this.form()?.reset();
        // El stock cambió: las filas nuevas deben partir del valor actualizado.
        this.productsResource.reload();
      },
      error: error => {
        this.saving.set(false);
        const { message, redirect } = resolveApiError(error, 'No se pudo registrar. Intenta nuevamente.');
        if (redirect) {
          void this.router.navigate([redirect]);
          return;
        }
        this.notificationService.show(message, 'error');
      },
    });
  }
}
