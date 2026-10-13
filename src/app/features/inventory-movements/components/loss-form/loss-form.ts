import { Component, computed, effect, inject, input, output, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerPackage, tablerTrash } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { OptionSelector } from '@/shared/components/option-selector/option-selector';
import type { ProductOption } from '@/features/products/interfaces/product.interface';
import type { CreateLossRequest, LossReason } from '../../interfaces/other-movement-request.interface';
import { REASON_LABELS } from '../../shared/movement-labels';
import { controlError, itemsRequired, quantityValidator } from '../../shared/movement-form-utils';

@Component({
  selector: 'app-loss-form',
  imports: [ReactiveFormsModule, Button, OptionSelector, NgIcon],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerPackage, tablerTrash })],
  templateUrl: './loss-form.html',
  host: { class: 'flex min-h-full flex-col' },
})
export class LossForm {
  private fb = inject(FormBuilder);

  products = input<ProductOption[]>([]);
  saving = input(false);

  submitted = output<CreateLossRequest>();

  readonly lossReasons: { value: LossReason; label: string }[] = [
    { value: 'LOSS_EXPIRED', label: 'Vencido' },
    { value: 'LOSS_DAMAGED', label: 'Dañado' },
  ];
  readonly reasonLabels = REASON_LABELS;

  form = this.fb.nonNullable.group({
    reason: this.fb.nonNullable.control<LossReason>('LOSS_EXPIRED'),
    notes: ['', [Validators.maxLength(500)]],
    items: this.fb.array<ReturnType<LossForm['createItem']>>([], [itemsRequired]),
  });

  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  private stocks = computed(() => new Map(this.products().map(product => [product.id, product.stock])));

  /** El selector no ofrece productos que ya están en la lista. */
  availableProducts = computed(() => {
    const added = new Set((this.formValue().items ?? []).map(item => item.productId));
    return this.products().filter(product => !added.has(product.id));
  });

  totalUnits = computed(() =>
    (this.formValue().items ?? []).reduce(
      (sum, item) => sum + (Number.isSafeInteger(item.quantity) && item.quantity! > 0 ? item.quantity! : 0), 0)
  );

  notesLength = computed(() => this.formValue().notes?.length ?? 0);

  /** El tope depende del stock vigente: se revalida cuando se recargan los productos. */
  revalidateStock = effect(() => {
    this.stocks();
    untracked(() => this.items.controls.forEach(item => item.controls.quantity.updateValueAndValidity()));
  });

  get items() {
    return this.form.controls.items;
  }

  /** Errores de stock visibles de inmediato; el resto, al tocar el campo. */
  get invalidItemsCount(): number {
    return this.items.controls.filter(item =>
      item.invalid && (item.touched || item.controls.quantity.hasError('exceedsStock'))
    ).length;
  }

  stockOf(productId: string): number {
    return this.stocks().get(productId) ?? 0;
  }

  resultingStock(index: number): number {
    const { productId, quantity } = this.items.at(index).getRawValue();
    const delta = Number.isSafeInteger(quantity) && quantity! > 0 ? quantity! : 0;
    return this.stockOf(productId) - delta;
  }

  quantityError(control: AbstractControl): string | null {
    const exceeds = control.getError('exceedsStock') as { stock: number } | null;
    if (exceeds) return exceeds.stock > 0 ? `Solo hay ${exceeds.stock} en stock.` : 'Sin stock disponible.';
    return controlError(control);
  }

  createItem(product: ProductOption) {
    const exceedsStock = (control: AbstractControl): ValidationErrors | null => {
      if (!Number.isSafeInteger(control.value)) return null;
      const stock = this.stockOf(product.id);
      return control.value > stock ? { exceedsStock: { stock } } : null;
    };

    return this.fb.group({
      productId: this.fb.nonNullable.control(product.id),
      name: this.fb.nonNullable.control(product.name),
      quantity: this.fb.control<number | null>(1, [Validators.required, quantityValidator, exceedsStock]),
    });
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

    const { reason, notes, items } = this.form.getRawValue();
    this.submitted.emit({
      reason,
      items: items.map(({ productId, quantity }) => ({ productId, quantity: quantity! })),
      notes: notes.trim() || undefined,
    });
  }
}
