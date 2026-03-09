import { ProductService } from '@/products/services/product.service';
import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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


  productForm = this.fb.group({
    name: ['', [Validators.required]],
    salePrice: ['', [Validators.min(0), Validators.required]],
    minStock: [0, [Validators.min(0), Validators.required]],
    // barcode: ['']
  })

  onSubmit() {
    if (this.productForm.invalid) return

    const { name, salePrice, minStock } = this.productForm.value
    if (!name || !salePrice || !minStock) return

    this.productService.createProduct({
      name,
      salePrice,
      minStock
    }).subscribe(() => {
      this.productForm.reset()
      this.onSuccess.emit()
    })
  }
}
