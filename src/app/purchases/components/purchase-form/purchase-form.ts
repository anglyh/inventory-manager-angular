import { DecimalPipe } from '@angular/common';
import { PurchaseService } from '@/purchases/services/purchase.service';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectableOption } from '@/shared/interfaces/selectable-option.interface';
import { Router, RouterLink } from '@angular/router';
import { CreatePurchaseDto } from '@/purchases/interfaces/purchase.interface';
import { ProductSelector } from "../product-selector/product-selector";

function todayAsYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

@Component({
  selector: 'purchase-form',
  imports: [ReactiveFormsModule, ProductSelector, DecimalPipe, RouterLink],
  templateUrl: './purchase-form.html',
})
export class PurchaseForm {
  private fb = inject(FormBuilder)
  private purchaseService = inject(PurchaseService)
  private router = inject(Router)

  purchaseForm = this.fb.group({
    supplierName: ['', [Validators.required]],
    date: [todayAsYmdLocal(), [Validators.required]],
    notes: [''],
    items: this.fb.array([
      this.createItemFormGroup()
    ])
  })

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      productId: ['', [Validators.required]],
      productName: ['', [Validators.required]],
      unitCost: [0, [Validators.min(0.01), Validators.required]],
      quantity: [1, [Validators.min(1), Validators.required]]
    });
  }

  get items() {
    return this.purchaseForm.get('items') as FormArray;
  }

  /** Totales solo para la vista; el envío sigue usando el valor del formulario. */
  lineSubtotal(index: number): number {
    const v = (this.items.at(index) as FormGroup).getRawValue();
    return (Number(v.unitCost) || 0) * (Number(v.quantity) || 0);
  }

  get totalPayable(): number {
    return this.items.controls.reduce((acc, ctrl) => {
      const v = (ctrl as FormGroup).getRawValue();
      return acc + (Number(v.unitCost) || 0) * (Number(v.quantity) || 0);
    }, 0);
  }

  get totalUnitsInLines(): number {
    return this.items.controls.reduce((acc, ctrl) => {
      const q = (ctrl as FormGroup).get('quantity')?.value;
      return acc + (Number(q) || 0);
    }, 0);
  }

  addItem() {
    this.items.push(this.createItemFormGroup());
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index)
    }
  }

  onSelectProduct(product: SelectableOption, index: number) {
    const itemGroup = this.items.at(index) as FormGroup;

    itemGroup.patchValue({
      productId: product.id,
      productName: product.name,
    })
  }

  onSubmit() {
    if (this.purchaseForm.invalid) return
    console.log(this.purchaseForm.value);

    const { supplierName, notes, items, date } = this.purchaseForm.value
    if (!supplierName || !items?.length || !date) return;

    const payload: CreatePurchaseDto = {
      supplierName,
      purchaseDate: date,
      notes,
      items: items.map(item => ({
        productId: item.productId,
        unitCost: Number(item.unitCost),
        quantity: Number(item.quantity)
      }))
    }

    this.purchaseService.registerPurchase(payload).subscribe({
      next: () => {
        this.purchaseForm.reset()
        this.router.navigate(['/purchases'])
      },
      error: (error: any) => {
        console.error(error)
      }
    })
  }
}
