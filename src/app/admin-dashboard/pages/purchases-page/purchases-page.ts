import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PurchaseForm } from '@/features/inventory-movements/components/purchase-form/purchase-form';
import { InventoryMovementService } from '@/features/inventory-movements/services/inventory-movement.service';
import type { CreatePurchaseRequest } from '@/features/inventory-movements/interfaces/purchase.interface';
import { ProductService } from '@/features/products/services/product.service';
import { SupplierService } from '@/features/suppliers/services/supplier.service';
import type { Supplier } from '@/features/suppliers/interfaces/supplier.interface';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { extractApiError } from '@/api/extract-api-error';
import { mapApiError } from '@/api/error-mapper';

@Component({
  selector: 'app-purchases-page',
  imports: [PurchaseForm],
  templateUrl: './purchases-page.html',
})
export class PurchasesPage {
  private readonly router = inject(Router);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private inventoryMovementService = inject(InventoryMovementService);
  private notificationService = inject(GlobalNotificationService);

  saving = signal(false);

  productsResource = rxResource({
    stream: () => this.productService.listProductOptions(),
  });

  suppliersResource = rxResource({
    stream: () => this.supplierService.getSuppliers(),
  });

  creatingSupplier = signal(false);
  supplierError = signal<string | null>(null);
  createdSupplier = signal<Supplier | null>(null);

  createSupplier(name: string) {
    this.creatingSupplier.set(true);
    this.supplierError.set(null);

    this.supplierService.createSupplier({ name }).subscribe({
      next: supplier => {
        // Se agrega a la lista local: recargar todos los proveedores no aporta nada.
        this.suppliersResource.update(list =>
          [...(list ?? []), supplier].sort((a, b) => a.name.localeCompare(b.name))
        );
        this.createdSupplier.set(supplier);
        this.creatingSupplier.set(false);
        this.notificationService.show('Proveedor creado');
      },
      error: error => {
        this.creatingSupplier.set(false);
        const apiError = extractApiError(error);
        const mapped = mapApiError(apiError);
        if (mapped.redirect) {
          void this.router.navigate([mapped.redirect]);
          return;
        }
        const message = mapped.fields ? Object.values(mapped.fields).join(' · ') : mapped.toast;
        this.supplierError.set(message || apiError.message || 'No se pudo crear el proveedor.');
      },
    });
  }

  registerPurchase(purchase: CreatePurchaseRequest) {
    this.saving.set(true);
    this.inventoryMovementService.registerPurchase(purchase).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.show('Compra registrada');
        this.onSaved();
      },
      error: error => {
        this.saving.set(false);
        const apiError = extractApiError(error);
        const mapped = mapApiError(apiError);
        if (mapped.redirect) {
          void this.router.navigate([mapped.redirect]);
          return;
        }
        const message = mapped.fields ? Object.values(mapped.fields).join(' · ') : mapped.toast;
        this.notificationService.show(message || apiError.message, 'error');
      },
    });
  }

  onSaved() {
    void this.router.navigate(['/movements'], { queryParams: { group: 'purchase' } });
  }
}
