import { ProductService } from '@/features/products/services/product.service';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductUpsertBody, ProductWithStock } from '@/features/products/interfaces/product.interface';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Button } from 'src/app/shared/components/button/button';
import { GlobalNotificationService } from 'src/app/shared/components/global-notification/global-notification.service';
import { CategoryService } from '@/features/categories/services/category.service';
import { CategorySelector } from '@/features/categories/components/category-selector/category-selector';
import { extractApiError } from '@/api/extract-api-error';
import { mapApiError } from '@/api/error-mapper';

@Component({
  selector: 'product-form',
  imports: [ReactiveFormsModule, Button, CategorySelector],
  templateUrl: './product-form.html',
})
export class ProductForm {
  private fb = inject(FormBuilder)
  private productService = inject(ProductService)
  private categoryService = inject(CategoryService)
  private globalNotification = inject(GlobalNotificationService)

  isSubmitting = signal(false)

  categoriesResource = rxResource({
    params: () => ({}),
    stream: () => this.categoryService.list(),
  })
  categories = computed(() => this.categoriesResource.value() ?? []);

  creatingCategory = signal(false)
  categoryError = signal<string | null>(null)

  onSuccess = output();
  onCancel = output();

  productInitialData = input<Partial<ProductWithStock> | null>(null)
  productForm = this.fb.group({
    name: ['', [Validators.required]],
    barcode: [''],
    salePrice: [1, [Validators.min(0.01), Validators.required]],
    minStock: [10, [Validators.min(0), Validators.required]],
    categoryId: [null as string | null],
  })

  categoryId = toSignal(this.productForm.controls.categoryId.valueChanges, {
    initialValue: this.productForm.controls.categoryId.value,
  })

  setCategory(id: string | null) {
    this.productForm.controls.categoryId.setValue(id)
  }

  createCategory(name: string) {
    this.creatingCategory.set(true)
    this.categoryError.set(null)

    this.categoryService
      .create({ name })
      .pipe(finalize(() => this.creatingCategory.set(false)))
      .subscribe({
        next: category => {
          // Se agrega a la lista local: recargar todas las categorías no aporta nada.
          this.categoriesResource.update(list =>
            [...(list ?? []), category].sort((a, b) => a.name.localeCompare(b.name))
          )
          this.setCategory(category.id)
          this.globalNotification.show('Categoría creada', 'success')
        },
        error: error => {
          const apiError = extractApiError(error)
          const mapped = mapApiError(apiError)
          const message = mapped.fields ? Object.values(mapped.fields).join(' · ') : mapped.toast
          this.categoryError.set(message || apiError.message || 'No se pudo crear la categoría.')
        },
      })
  }

  formEffect = effect(() => {
    const salePrice = this.productInitialData()?.salePrice;
    const rawCategoryId = this.productInitialData()?.categoryId;
    const categoryId =
      rawCategoryId == null || String(rawCategoryId).trim() === '' ? null : String(rawCategoryId);
    this.productForm.patchValue({
      name: this.productInitialData()?.name ?? '',
      barcode: this.productInitialData()?.barcode ?? '',
      salePrice: salePrice != null ? Number(salePrice) : 1,
      minStock: this.productInitialData()?.minStock ?? 10,
      categoryId
    })
  })

  onSubmit() {
    if (this.productForm.invalid) return

    const { name, barcode, salePrice, minStock, categoryId } = this.productForm.value
    if (name == null || salePrice == null || minStock == null) return
    if (Number(salePrice) <= 0) return

    const cleanedBarcode = (barcode ?? '').trim();

    const payload: ProductUpsertBody = {
      name,
      salePrice,
      minStock,
      categoryId: categoryId ?? null,
      ...(cleanedBarcode ? { barcode: cleanedBarcode } : {}),
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
            isEdit ? 'Producto actualizado' : 'Producto creado',
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
