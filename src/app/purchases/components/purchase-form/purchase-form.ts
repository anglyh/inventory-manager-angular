import { PurchaseService } from '@/purchases/services/purchase.service';
import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'purchase-form',
  imports: [ReactiveFormsModule],
  templateUrl: './purchase-form.html',
})
export class PurchaseForm {
  private fb = inject(FormBuilder)
  private purchaseService = inject(PurchaseService)

  onSuccess = output();
  onCancel = output();


  purchaseForm = this.fb.group({
    name: ['', [Validators.required]],
    salePrice: ['', [Validators.min(0), Validators.required]],
    minStock: [0, [Validators.min(0), Validators.required]],
    // barcode: ['']
  })

  onSubmit() {
    if (this.purchaseForm.invalid) return

    const { name, salePrice, minStock } = this.purchaseForm.value
    if (!name || !salePrice || !minStock) return

  }
}
