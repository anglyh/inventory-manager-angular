import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerChevronDown } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { SegmentedControl, type SegmentedOption } from '@/shared/components/segmented-control/segmented-control';
import { MAX_MONEY, moneyValidator } from '@/shared/utils/form-validators';
import { getLimaTodayPlainDate } from '@/features/reports/utils/lima-profit-range';
import type { CreateExpenseRequest, ExpenseCategory, ExpenseGroup, ExpenseSource } from '../../interfaces/expense.interface';
import { EXPENSE_GROUP_LABEL } from '../../utils/expense-labels';

const DESCRIPTION_MAX_LENGTH = 500;

const SOURCE_HINT: Record<ExpenseSource, string> = {
  CASH_REGISTER: 'Sale del efectivo de la caja abierta',
  OUTSIDE: 'Yape, banco o bolsillo del dueño',
};

const GROUP_ORDER: ExpenseGroup[] = ['LODGING', 'GENERAL'];

/** Registrar un gasto en un modal: categoría, monto, día, nota y de dónde sale el dinero. */
@Component({
  selector: 'expense-form',
  imports: [ReactiveFormsModule, NgIcon, Button, Modal, SegmentedControl],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerChevronDown })],
  templateUrl: './expense-form.html',
})
export class ExpenseForm {
  private fb = inject(FormBuilder);

  open = input(false);
  saving = input(false);
  /** Mensaje del backend (409/422): se muestra dentro del modal. */
  error = input<string | null>(null);
  categories = input.required<ExpenseCategory[]>();

  submitted = output<CreateExpenseRequest>();
  cancelled = output<void>();
  closed = output<void>();

  readonly descriptionMaxLength = DESCRIPTION_MAX_LENGTH;
  readonly submitAttempted = signal(false);
  today = getLimaTodayPlainDate();

  readonly sources: readonly SegmentedOption<ExpenseSource>[] = [
    { value: 'CASH_REGISTER', label: 'De la caja' },
    { value: 'OUTSIDE', label: 'Fuera de caja' },
  ];

  form = this.fb.group({
    categoryId: this.fb.nonNullable.control('', Validators.required),
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(MAX_MONEY),
      moneyValidator,
    ]),
    spentOn: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.nonNullable.control('', Validators.maxLength(DESCRIPTION_MAX_LENGTH)),
    source: this.fb.nonNullable.control<ExpenseSource>('OUTSIDE'),
  });

  private value = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  readonly source = computed(() => this.value().source ?? 'OUTSIDE');
  readonly sourceHint = computed(() => SOURCE_HINT[this.source()]);

  /** Solo categorías activas, agrupadas por negocio. */
  readonly groups = computed(() => {
    const active = this.categories().filter(category => category.isActive);
    return GROUP_ORDER.map(group => ({
      label: EXPENSE_GROUP_LABEL[group],
      categories: active.filter(category => category.group === group),
    })).filter(group => group.categories.length > 0);
  });

  readonly selectedCategory = computed(() => {
    const id = this.value().categoryId;
    return this.categories().find(category => category.id === id) ?? null;
  });

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    untracked(() => {
      this.today = getLimaTodayPlainDate();
      this.submitAttempted.set(false);
      this.form.reset({ categoryId: '', amount: null, spentOn: this.today, description: '', source: 'OUTSIDE' });
    });
  });

  get categoryInvalid(): boolean {
    return this.submitAttempted() && this.form.controls.categoryId.invalid;
  }

  get amountError(): string | null {
    const control = this.form.controls.amount;
    if (!this.submitAttempted() || control.valid) return null;
    if (control.hasError('required')) return 'Ingresa el monto.';
    return 'Ingresa un monto mayor a cero, con hasta dos decimales.';
  }

  get spentOnInvalid(): boolean {
    return this.submitAttempted() && this.form.controls.spentOn.invalid;
  }

  selectCategory(category: ExpenseCategory) {
    this.form.controls.categoryId.setValue(category.id);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  setSource(source: ExpenseSource) {
    this.form.controls.source.setValue(source);
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.form.invalid) return;
    const { categoryId, amount, spentOn, description, source } = this.form.getRawValue();
    const note = description.trim();
    this.submitted.emit({
      categoryId,
      amount: amount!,
      spentOn,
      source,
      ...(note ? { description: note } : {}),
    });
  }
}
