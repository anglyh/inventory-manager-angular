import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerHistory, tablerPackage, tablerSearch } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import type { ProductOption } from '@/features/products/interfaces/product.interface';
import type { StockCountRequest } from '../../interfaces/other-movement-request.interface';
import { controlError, countValidator, normalizeProductSearch, trimmedRequired } from '../../shared/movement-form-utils';

@Component({
  selector: 'stock-count-form',
  imports: [ReactiveFormsModule, RouterLink, Button, NgIcon],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerHistory, tablerPackage, tablerSearch })],
  templateUrl: './stock-count-form.html',
  host: { class: 'flex min-h-full flex-col' },
})
export class StockCountForm {
  private fb = inject(FormBuilder);

  products = input<ProductOption[]>([]);
  saving = input(false);

  submitted = output<StockCountRequest>();

  readonly controlError = controlError;

  /** Un control por producto (clave: id); vacío significa que aún no se contó. */
  readonly counts = this.fb.record<FormControl<number | null>>({});

  form = this.fb.nonNullable.group({
    notes: ['', [trimmedRequired, Validators.maxLength(500)]],
    counts: this.counts,
  });

  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  /** Filtros de vista: no forman parte del conteo y no borran lo ingresado. */
  query = signal('');
  onlyWithDifference = signal(false);

  syncControls = effect(() => {
    const products = this.products();
    untracked(() => {
      const counts = this.counts;
      const ids = new Set(products.map(product => product.id));
      for (const id of Object.keys(counts.controls)) {
        if (!ids.has(id)) counts.removeControl(id, { emitEvent: false });
      }
      for (const product of products) {
        if (!counts.contains(product.id)) {
          counts.addControl(product.id, this.fb.control<number | null>(null, [countValidator]), { emitEvent: false });
        }
      }
      counts.updateValueAndValidity();
    });
  });

  /** Diferencia contado − sistema por producto; solo para conteos válidos. */
  private differences = computed(() => {
    const counts = this.formValue().counts ?? {};
    const result = new Map<string, number>();
    for (const product of this.products()) {
      const counted = counts[product.id];
      if (Number.isSafeInteger(counted) && counted! >= 0) result.set(product.id, counted! - product.stock);
    }
    return result;
  });

  visibleProducts = computed(() => {
    const query = normalizeProductSearch(this.query());
    const onlyDifference = this.onlyWithDifference();
    const differences = this.differences();

    return this.products().filter(product => {
      if (onlyDifference && !differences.get(product.id)) return false;
      if (!query) return true;
      return normalizeProductSearch(product.name).includes(query)
        || (product.barcode ?? '').toLowerCase().includes(query);
    });
  });

  countedCount = computed(() => this.differences().size);

  summary = computed(() => {
    let withDifference = 0;
    let surplus = 0;
    let shortage = 0;
    for (const difference of this.differences().values()) {
      if (difference > 0) surplus += difference;
      if (difference < 0) shortage -= difference;
      if (difference) withDifference++;
    }
    return { withDifference, surplus, shortage };
  });

  notesLength = computed(() => this.formValue().notes?.length ?? 0);
  notesValid = computed(() => {
    const notes = this.formValue().notes?.trim() ?? '';
    return notes.length > 0 && (this.formValue().notes?.length ?? 0) <= 500;
  });

  difference(productId: string): number | null {
    return this.differences().get(productId) ?? null;
  }

  reset() {
    this.form.reset();
    this.query.set('');
    this.onlyWithDifference.set(false);
  }

  onSubmit() {
    if (this.saving() || !this.summary().withDifference) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Solo viajan las diferencias: el backend rechaza un conteo que coincide en todo.
    const items = this.products()
      .filter(product => this.difference(product.id))
      .map(product => ({ productId: product.id, countedQuantity: this.counts.controls[product.id].value! }));

    this.submitted.emit({ notes: this.form.controls.notes.value.trim(), items });
  }
}
