import { Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerHistory } from '@ng-icons/tabler-icons';
import { InitialLoadForm } from '@/features/inventory-movements/components/initial-load-form/initial-load-form';
import { InventoryMovementService } from '@/features/inventory-movements/services/inventory-movement.service';
import type { CreateInitialLoadRequest } from '@/features/inventory-movements/interfaces/other-movement-request.interface';
import { resolveApiError } from '@/features/inventory-movements/shared/movement-form-utils';
import { ProductService } from '@/features/products/services/product.service';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';

@Component({
  selector: 'app-initial-load-page',
  imports: [InitialLoadForm, RouterLink, NgIcon],
  viewProviders: [provideIcons({ tablerHistory })],
  templateUrl: './initial-load-page.html',
  host: { class: 'flex min-h-full flex-col gap-4' },
})
export class InitialLoadPage {
  private router = inject(Router);
  private productService = inject(ProductService);
  private inventoryMovementService = inject(InventoryMovementService);
  private notificationService = inject(GlobalNotificationService);

  saving = signal(false);
  private form = viewChild(InitialLoadForm);

  productsResource = rxResource({
    stream: () => this.productService.listProductOptions(),
  });

  registerInitialLoad(load: CreateInitialLoadRequest) {
    this.saving.set(true);
    this.inventoryMovementService.registerInitialLoad(load).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.show('Carga inicial registrada', 'success');
        this.form()?.reset();
        // Los productos cargados ya tienen movimientos y dejan de ser elegibles.
        this.productsResource.reload();
      },
      error: error => {
        this.saving.set(false);
        const { message, redirect } = resolveApiError(error, 'No se pudo registrar la carga inicial. Intenta nuevamente.');
        if (redirect) {
          void this.router.navigate([redirect]);
          return;
        }
        this.notificationService.show(message, 'error');
      },
    });
  }
}
