import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerPencil, tablerTrash } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';

export interface NameCatalogItem {
  id: string;
  name: string;
}

export interface NameCatalogLabels {
  /** En minúscula, p. ej. "categoría". */
  singular: string;
  /** En minúscula, p. ej. "categorías". */
  plural: string;
  placeholder: string;
}

const NAME_MAX_LENGTH = 100;

/**
 * Lista editable de registros que solo tienen nombre (categorías, proveedores…).
 * Presentacional: emite las acciones y el padre hace las peticiones.
 */
@Component({
  selector: 'app-name-catalog',
  imports: [ReactiveFormsModule, NgIcon, Button, Modal],
  viewProviders: [provideIcons({ tablerPencil, tablerTrash })],
  templateUrl: './name-catalog.html',
})
export class NameCatalog {
  private fb = inject(FormBuilder);

  items = input<NameCatalogItem[]>([]);
  labels = input.required<NameCatalogLabels>();
  loading = input(false);
  loadError = input<string | null>(null);

  creating = input(false);
  createError = input<string | null>(null);
  saving = input(false);
  saveError = input<string | null>(null);
  deletingId = input<string | null>(null);

  create = output<string>();
  update = output<NameCatalogItem>();
  remove = output<NameCatalogItem>();
  retry = output<void>();

  readonly nameMaxLength = NAME_MAX_LENGTH;

  createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
  });

  editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
  });

  editOpen = signal(false);
  editing = signal<NameCatalogItem | null>(null);
  /** Un error de una edición anterior no se muestra al abrir otro registro. */
  showSaveError = signal(false);

  /** El padre no informa éxitos: un envío que termina sin error se da por guardado. */
  private wasCreating = false;
  private wasSaving = false;

  resetAfterCreate = effect(() => {
    const creating = this.creating();
    if (this.wasCreating && !creating && !this.createError()) this.createForm.reset();
    this.wasCreating = creating;
  });

  closeAfterSave = effect(() => {
    const saving = this.saving();
    if (!this.wasSaving && saving) this.showSaveError.set(true);
    if (this.wasSaving && !saving && !this.saveError()) this.editOpen.set(false);
    this.wasSaving = saving;
  });

  submitCreate() {
    const name = this.createForm.controls.name.value.trim();
    if (!name || this.createForm.invalid || this.creating()) return;
    this.create.emit(name);
  }

  openEdit(item: NameCatalogItem) {
    this.editing.set(item);
    this.editForm.reset({ name: item.name });
    this.showSaveError.set(false);
    this.editOpen.set(true);
  }

  /** Los datos se limpian tras la animación de salida del modal. */
  onEditClosed() {
    this.editOpen.set(false);
    this.editing.set(null);
  }

  submitEdit() {
    const item = this.editing();
    const name = this.editForm.controls.name.value.trim();
    if (!item || !name || this.editForm.invalid || this.saving()) return;
    if (name === item.name) {
      this.editOpen.set(false);
      return;
    }
    this.update.emit({ id: item.id, name });
  }

  confirmRemove(item: NameCatalogItem) {
    if (window.confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) {
      this.remove.emit(item);
    }
  }
}
