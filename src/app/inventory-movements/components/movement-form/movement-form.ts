import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OptionSelector } from "../../../shared/components/option-selector/option-selector";
import { FormErrorLabel } from "@/shared/components/form-error-label/form-error-label";
import { InventoryMovementService } from '../../services/inventory-movement.service';
import { CreateInventoryMovement } from '../../interfaces/inventory-movement.interface';
import { Product } from '@/products/interfaces/product.interface';
import { GlobalNotificationService } from 'src/app/shared/components/global-notification/global-notification.service';
import { mapApiError } from 'src/app/api/error-mapper';
import { extractApiError } from 'src/app/api/extract-api-error';
import { ProductService } from 'src/app/products/services/product.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'movement-form',
  imports: [ReactiveFormsModule, OptionSelector, DecimalPipe, RouterLink, FormErrorLabel, OptionSelector, Button],
  templateUrl: './movement-form.html',
})
export class MovementForm {
  type = input<'entry' | 'exit'>('entry');

  private fb = inject(FormBuilder)
  private movementService = inject(InventoryMovementService)
  private productService = inject(ProductService);
  private router = inject(Router)
  #globalNotificationService = inject(GlobalNotificationService)

  productsResource = rxResource({
    params: () => ({}),
    stream: () => {
      return this.productService.listProductOptions()
    }
  })

  productsListOptions = computed(() => this.productsResource.value() ?? [])
  
  isLoading = signal(false);

  movementForm = this.fb.group({
    entityName: [''],
    notes: [''],
    items: this.fb.array([
      this.createItemFormGroup()
    ])
  })

  errorMessage = signal('');

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      productId: ['', [Validators.required]],
      productName: ['', [Validators.required]],
      unitCost: [0, [Validators.min(0.01), Validators.required]],
      quantity: [1, [Validators.min(1), Validators.required]]
    });
  }

  get items() {
    return this.movementForm.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.createItemFormGroup());
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index)
    }
  }

  onSelectProduct(product: Product | null, index: number) {
    const itemGroup = this.items.at(index) as FormGroup;

    if (!product) {
      itemGroup.patchValue({ productId: '', productName: '' })
      return
    }

    itemGroup.patchValue({
      productId: product.id,
      productName: product.name,
    })

    if (this.type() === "exit") {
      itemGroup.patchValue({ unitCost: Number(product.salePrice) })
    }
  }

  onClearProduct(index: number) {
    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({ productId: '', productName: '' })
  }

  onSubmit() {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched()
      return
    }
    if (this.isLoading()) return;
    console.log(this.movementForm.value);

    const { entityName, notes, items } = this.movementForm.value
    if (!items?.length) return;

    const payload: CreateInventoryMovement = {
      entityName,
      notes,
      items: items.map(item => ({
        productId: item.productId,
        unitPrice: Number(item.unitCost),
        quantity: Number(item.quantity)
      }))
    }

    const request$ = this.type() === 'entry'
      ? this.movementService.registerEntry(payload)
      : this.movementService.registerExit(payload);

    this.isLoading.set(true);
    request$.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.movementForm.reset()
        this.router.navigate([this.type() === 'entry' ? '/purchases' : '/sales'])
        this.#globalNotificationService.show(`
          ${this.type() === 'entry'
            ? 'Compra realizada con Éxito'
            : 'Venta realizada con Éxito'
          }
        `)
      },
      error: (error) => {
        this.isLoading.set(false);
        const apiError = extractApiError(error)
        const mapped = mapApiError(apiError)

        if (mapped.toast) {
          this.#globalNotificationService.show(mapped.toast, 'error')
        }
      },
    })
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

}

