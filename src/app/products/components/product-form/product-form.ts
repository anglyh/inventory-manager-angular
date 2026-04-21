import { ProductService } from '@/products/services/product.service';
import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductUpsertBody, ProductWithStock } from '@/products/interfaces/product.interface';

@Component({
  selector: 'product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.html',
})
export class ProductForm {
  private fb = inject(FormBuilder)
  private productService = inject(ProductService)

  onSuccess = output();
  onCancel = output();

  productInitialData = input<Partial<ProductWithStock> | null>(null)
  productForm = this.fb.group({
    name: ['', [Validators.required]],
    salePrice: [0, [Validators.min(0), Validators.required]],
    minStock: [0, [Validators.min(0), Validators.required]],
    categoryId: [''],
  })

  formEffect = effect(() => {
    const salePrice = this.productInitialData()?.salePrice;
    this.productForm.patchValue({
      name: this.productInitialData()?.name ?? '',
      salePrice: salePrice != null ? Number(salePrice) : 0,
      minStock: this.productInitialData()?.minStock ?? 0,
      categoryId: this.productInitialData()?.categoryId ?? null
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
    const request$ = id
      ? this.productService.updateProduct(id, payload)
      : this.productService.createProduct(payload)

    request$.subscribe(() => {
      this.onSuccess.emit()
    })
  }
}
