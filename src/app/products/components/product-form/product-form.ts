import { ProductService } from '@/products/services/product.service';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductUpsertBody, ProductWithStock } from '@/products/interfaces/product.interface';
import { finalize } from 'rxjs';

import { Button } from 'src/app/shared/components/button/button';
import { GlobalNotificationService } from 'src/app/shared/components/global-notification/global-notification.service';

@Component({
  selector: 'product-form',
  imports: [ReactiveFormsModule, Button],
  templateUrl: './product-form.html',
})
export class ProductForm {
  private fb = inject(FormBuilder)
  private productService = inject(ProductService)
  private globalNotification = inject(GlobalNotificationService)

  isSubmitting = signal(false)

  onSuccess = output();
  onCancel = output();

  productInitialData = input<Partial<ProductWithStock> | null>(null)
  productForm = this.fb.group({
    name: ['', [Validators.required]],
    salePrice: [0, [Validators.min(0), Validators.required]],
    minStock: [10, [Validators.min(0), Validators.required]],
    categoryId: [null],
  })

  formEffect = effect(() => {
    const salePrice = this.productInitialData()?.salePrice;
    this.productForm.patchValue({
      name: this.productInitialData()?.name ?? '',
      salePrice: salePrice != null ? Number(salePrice) : 0,
      minStock: this.productInitialData()?.minStock ?? 0,
      categoryId: null
    })
  })

  onSubmit() {
    if (this.productForm.invalid) return

    const { name, salePrice, minStock, categoryId } = this.productForm.value
    if (name == null || salePrice == null || minStock == null) return

    const payload: ProductUpsertBody = {
      name,
      salePrice,
      minStock,
      categoryId: categoryId ?? null,
    }

    const id = this.productInitialData()?.id
    const isEdit = Boolean(id)
    const request$ = id
      ? this.productService.updateProduct(id, payload)
      : this.productService.createProduct(payload)

    this.isSubmitting.set(true)

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.globalNotification.show(
            isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
            'success',
          )
          this.onSuccess.emit()
        },
        error: () => {
          this.globalNotification.show(
            isEdit ? 'No se pudo actualizar el producto' : 'No se pudo crear el producto',
            'error',
          )
        },
      })
  }
}
