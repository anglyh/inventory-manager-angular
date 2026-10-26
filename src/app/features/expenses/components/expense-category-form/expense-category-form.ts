import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { SegmentedControl, type SegmentedOption } from '@/shared/components/segmented-control/segmented-control';
import { trimmedRequired } from '@/shared/utils/form-validators';
import type {
  CreateExpenseCategoryRequest,
  ExpenseCategory,
  ExpenseGroup,
  UpdateExpenseCategoryRequest,
} from '../../interfaces/expense.interface';

export type ExpenseCategorySubmit =
  | { id: null; body: CreateExpenseCategoryRequest }
  | { id: string; body: UpdateExpenseCategoryRequest };

const NAME_MAX_LENGTH = 50;

/** Crear o editar una categoría de gastos en un modal. */
@Component({
  selector: 'expense-category-form',
  imports: [ReactiveFormsModule, NgIcon, Button, Modal, SegmentedControl],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './expense-category-form.html',
})
export class ExpenseCategoryForm {
  private fb = inject(FormBuilder).nonNullable;

  open = input(false);
  saving = input(false);
  error = input<string | null>(null);
  /** null = crear. */
  category = input<ExpenseCategory | null>(null);

  submitted = output<ExpenseCategorySubmit>();
  cancelled = output<void>();
  closed = output<void>();

  readonly nameMaxLength = NAME_MAX_LENGTH;
  readonly submitAttempted = signal(false);

  readonly groups: readonly SegmentedOption<ExpenseGroup>[] = [
    { value: 'LODGING', label: 'Hospedaje' },
    { value: 'GENERAL', label: 'General' },
  ];

  form = this.fb.group({
    name: this.fb.control('', [trimmedRequired, Validators.maxLength(NAME_MAX_LENGTH)]),
    group: this.fb.control<ExpenseGroup>('GENERAL'),
  });

  private value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  readonly group = computed(() => this.value().group ?? 'GENERAL');

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    const category = this.category();
    untracked(() => {
      this.submitAttempted.set(false);
      this.form.reset({ name: category?.name ?? '', group: category?.group ?? 'GENERAL' });
    });
  });

  get nameInvalid(): boolean {
    return this.submitAttempted() && this.form.controls.name.invalid;
  }

  setGroup(group: ExpenseGroup) {
    this.form.controls.group.setValue(group);
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.form.invalid) return;
    const { name, group } = this.form.getRawValue();
    const body = { name: name.trim(), group };
    const category = this.category();
    this.submitted.emit(category ? { id: category.id, body } : { id: null, body });
  }
}
