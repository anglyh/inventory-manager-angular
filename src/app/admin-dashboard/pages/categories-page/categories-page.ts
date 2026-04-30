import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Category, CategoryUpsertBody } from '@/categories/interfaces/category.interface';
import { CategoryService } from '@/categories/services/category.service';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { FormErrorLabel } from '@/shared/components/form-error-label/form-error-label';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { extractApiError } from '@/api/extract-api-error';
import { mapApiError } from '@/api/error-mapper';

@Component({
  selector: 'app-categories-page',
  imports: [ReactiveFormsModule, Button, Modal, FormErrorLabel],
  templateUrl: './categories-page.html',
})
export class CategoriesPage {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private notification = inject(GlobalNotificationService);

  isCreating = signal(false);
  isUpdating = signal(false);
  isDeletingId = signal<string | null>(null);

  isEditOpen = signal(false);
  editing = signal<Category | null>(null);

  categoriesResource = rxResource({
    params: () => ({}),
    stream: () => this.categoryService.list(),
  });

  categories = computed(() => this.categoriesResource.value() ?? []);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  editForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  openEdit(category: Category) {
    this.editing.set(category);
    this.editForm.reset({
      name: category.name,
    });
    this.isEditOpen.set(true);
  }

  closeEdit() {
    this.isEditOpen.set(false);
    this.editing.set(null);
  }

  submitCreate() {
    if (this.createForm.invalid || this.isCreating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const raw = this.createForm.getRawValue();
    const payload: CategoryUpsertBody = {
      name: (raw.name ?? '').trim(),
    };

    this.clearServerErrors(this.createForm);
    this.isCreating.set(true);
    this.categoryService
      .create(payload)
      .pipe(finalize(() => this.isCreating.set(false)))
      .subscribe({
        next: () => {
          this.notification.show('Categoría creada correctamente', 'success');
          this.createForm.reset({ name: '' });
          this.categoriesResource.reload();
        },
        error: (err) => this.handleUpsertError(err, this.createForm, 'crear'),
      });
  }

  submitEdit() {
    const current = this.editing();
    if (!current) return;

    if (this.editForm.invalid || this.isUpdating()) {
      this.editForm.markAllAsTouched();
      return;
    }

    const raw = this.editForm.getRawValue();
    const payload: CategoryUpsertBody = {
      name: (raw.name ?? '').trim(),
    };

    this.clearServerErrors(this.editForm);
    this.isUpdating.set(true);
    this.categoryService
      .update(current.id, payload)
      .pipe(finalize(() => this.isUpdating.set(false)))
      .subscribe({
        next: () => {
          this.notification.show('Categoría actualizada correctamente', 'success');
          this.closeEdit();
          this.categoriesResource.reload();
        },
        error: (err) => this.handleUpsertError(err, this.editForm, 'actualizar'),
      });
  }

  deleteCategory(category: Category) {
    const ok = window.confirm(
      `¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;

    this.isDeletingId.set(category.id);
    this.categoryService
      .delete(category.id)
      .pipe(finalize(() => this.isDeletingId.set(null)))
      .subscribe({
        next: () => {
          this.notification.show('Categoría eliminada correctamente', 'success');
          this.categoriesResource.reload();
        },
        error: (err) => {
          const apiError = extractApiError(err);
          const mapped = mapApiError(apiError);

          this.notification.show(
            mapped.toast ?? 'No se pudo eliminar la categoría',
            'error',
          );
        },
      });
  }

  private handleUpsertError(
    err: unknown,
    form: FormGroup,
    action: 'crear' | 'actualizar',
  ) {
    const apiError = extractApiError(err);
    const mapped = mapApiError(apiError);

    if (apiError.code === 'CONFLICT') {
      this.notification.show('Ya existe una categoría con ese nombre', 'error');
      form.controls['name']?.setErrors({ server: 'Ya existe una categoría con ese nombre' });
      return;
    }

    if (mapped.fields) {
      for (const [field, message] of Object.entries(mapped.fields)) {
        const control = (form as any).controls?.[field];
        if (control) control.setErrors({ server: message });
      }
      form.markAllAsTouched();
      return;
    }

    this.notification.show(
      mapped.toast ?? `No se pudo ${action} la categoría`,
      'error',
    );
  }

  private clearServerErrors(form: any) {
    for (const control of Object.values(form.controls) as AbstractControl[]) {
      const errors = control.errors;
      if (!errors || !errors['server']) continue;

      const { server, ...rest } = errors as Record<string, unknown>;
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
}

