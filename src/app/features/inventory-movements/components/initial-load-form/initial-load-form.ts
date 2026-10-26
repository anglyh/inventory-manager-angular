import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerHistory, tablerPackage, tablerTrash } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { OptionSelector } from '@/shared/components/option-selector/option-selector';
import type { ProductOption } from '@/features/products/interfaces/product.interface';
import type { CreateInitialLoadRequest } from '../../interfaces/other-movement-request.interface';
import { controlError, itemsRequired, lineCents, moneyValidator, quantityValidator } from '../../shared/movement-form-utils';

@Component({
  selector: 'initial-load-form',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, Button, OptionSelector, NgIcon],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerHistory, tablerPackage, tablerTrash })],
  templateUrl: './initial-load-form.html',
  host: { class: 'flex min-h-full flex-col' },
})
export class InitialLoadForm {
  private fb = inject(FormBuilder);

  products = input<ProductOption[]>([]);
  saving = input(false);

  submitted = output<CreateInitialLoadRequest>();

  readonly controlError = controlError;

  form = this.fb.nonNullable.group({
    notes: ['', [Validators.maxLength(500)]],
    items: this.fb.array<ReturnType<InitialLoadForm['createItem']>>([], [itemsRequired]),
  });

  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  /** Solo admiten carga inicial los productos que nunca tuvieron movimientos. */
  private eligibleProducts = computed(() => this.products().filter(product => !product.hasMovements));

  hasEligibleProducts = computed(() => this.eligibleProducts().length > 0);

  availableProducts = computed(() => {
    const added = new Set((this.formValue().items ?? []).map(item => item.productId));
    return this.eligibleProducts().filter(product => !added.has(product.id));
  });

  totalCents = computed(() =>
    (this.formValue().items ?? []).reduce(
      (sum, item) => sum + lineCents(item.unitCost ?? null, item.quantity ?? null), 0)
  );

  totalUnits = computed(() =>
    (this.formValue().items ?? []).reduce(
      (sum, item) => sum + (Number.isSafeInteger(item.quantity) ? item.quantity! : 0), 0)
  );

  notesLength = computed(() => this.formValue().notes?.length ?? 0);

  /** Solo cuenta filas ya tocadas, para no alarmar antes de interactuar. */
  get invalidItemsCount(): number {
    return this.items.controls.filter(item => item.touched && item.invalid).length;
  }

  get items() {
    return this.form.controls.items;
  }

  createItem(product: ProductOption) {
    return this.fb.group({
      productId: this.fb.nonNullable.control(product.id),
      name: this.fb.nonNullable.control(product.name),
      unitCost: this.fb.control<number | null>(null, [Validators.required, moneyValidator]),
      quantity: this.fb.control<number | null>(1, [Validators.required, quantityValidator]),
    });
  }

  lineTotal(index: number): number {
    const { unitCost, quantity } = this.items.at(index).getRawValue();
    return lineCents(unitCost, quantity) / 100;
  }

  addProduct(product: ProductOption | null) {
    if (!product || this.items.controls.some(item => item.controls.productId.value === product.id)) return;
    this.items.push(this.createItem(product));
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  reset() {
    this.items.clear();
    this.form.reset();
  }

  onSubmit() {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { notes, items } = this.form.getRawValue();
    const request: CreateInitialLoadRequest = {
      items: items.map(({ productId, unitCost, quantity }) => ({
        productId,
        unitPrice: unitCost!,
        quantity: quantity!,
      })),
    };
    if (notes.trim()) request.notes = notes.trim();

    this.submitted.emit(request);
  }
}
