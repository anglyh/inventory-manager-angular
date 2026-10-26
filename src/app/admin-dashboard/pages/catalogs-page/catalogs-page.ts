import { Component, computed, effect, inject, ResourceRef, signal, untracked } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CategoryService } from '@/features/categories/services/category.service';
import { SupplierService } from '@/features/suppliers/services/supplier.service';
import { NameCatalog, NameCatalogItem, NameCatalogLabels } from '@/shared/components/name-catalog/name-catalog';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { extractApiError } from '@/api/extract-api-error';
import { mapApiError } from '@/api/error-mapper';
import { ModuleTabs } from '@/shared/components/module-tabs/module-tabs';
import { PRODUCTS_TABS } from '@/admin-dashboard/module-tabs';

type CatalogTab = 'categories' | 'suppliers';

interface CatalogConfig {
  label: string;
  labels: NameCatalogLabels;
  create: (name: string) => Observable<unknown>;
  update: (id: string, name: string) => Observable<unknown>;
  remove: (id: string) => Observable<unknown>;
}

const byName = (a: NameCatalogItem, b: NameCatalogItem) => a.name.localeCompare(b.name);

@Component({
  selector: 'app-catalogs-page',
  imports: [NameCatalog, ModuleTabs],
  templateUrl: './catalogs-page.html',
})
export class CatalogsPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  private supplierService = inject(SupplierService);
  private notification = inject(GlobalNotificationService);

  readonly moduleTabs = PRODUCTS_TABS;

  readonly config: Record<CatalogTab, CatalogConfig> = {
    categories: {
      label: 'Categorías',
      labels: { singular: 'categoría', plural: 'categorías', placeholder: 'Ej.: Bebidas' },
      create: name => this.categoryService.create({ name }),
      update: (id, name) => this.categoryService.update(id, { name }),
      remove: id => this.categoryService.delete(id),
    },
    suppliers: {
      label: 'Proveedores',
      labels: { singular: 'proveedor', plural: 'proveedores', placeholder: 'Ej.: Distribuidora Lima' },
      create: name => this.supplierService.createSupplier({ name }),
      update: (id, name) => this.supplierService.updateSupplier(id, { name }),
      // 409 si tiene compras: el mensaje del backend lo explica.
      remove: id => this.supplierService.deleteSupplier(id),
    },
  };

  /** Cada catálogo es su propia ruta (pestaña del módulo Productos): lo fija `data.catalog`. */
  private data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  tab = computed<CatalogTab>(() => (this.data()['catalog'] === 'suppliers' ? 'suppliers' : 'categories'));

  categoriesResource = rxResource({ stream: () => this.categoryService.list() });
  suppliersResource = rxResource({ stream: () => this.supplierService.getSuppliers() });

  /** Ambos recursos se usan solo como listas de { id, name }. */
  activeResource = computed<ResourceRef<NameCatalogItem[] | undefined>>(() =>
    this.tab() === 'categories' ? this.categoriesResource : this.suppliersResource
  );

  items = computed<NameCatalogItem[]>(() => {
    const resource = this.activeResource();
    return resource.hasValue() ? [...resource.value()].sort(byName) : [];
  });

  loadError = computed(() =>
    this.activeResource().error() ? `No se pudieron cargar los ${this.config[this.tab()].labels.plural}.` : null
  );

  creating = signal(false);
  createError = signal<string | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  deletingId = signal<string | null>(null);

  constructor() {
    // Los errores de una pestaña no deben aparecer en la otra.
    effect(() => {
      this.tab();
      untracked(() => {
        this.createError.set(null);
        this.saveError.set(null);
      });
    });
  }

  create(name: string) {
    const config = this.config[this.tab()];
    this.creating.set(true);
    this.createError.set(null);

    config.create(name).subscribe({
      next: () => {
        this.creating.set(false);
        this.notification.show(`Se agregó "${name}"`);
        this.activeResource().reload();
      },
      error: error => {
        this.createError.set(this.errorMessage(error, `No se pudo agregar "${name}".`));
        this.creating.set(false);
      },
    });
  }

  update(item: NameCatalogItem) {
    const config = this.config[this.tab()];
    this.saving.set(true);
    this.saveError.set(null);

    config.update(item.id, item.name).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.show('Cambios guardados');
        this.activeResource().reload();
      },
      error: error => {
        this.saveError.set(this.errorMessage(error, 'No se pudieron guardar los cambios.'));
        this.saving.set(false);
      },
    });
  }

  remove(item: NameCatalogItem) {
    const config = this.config[this.tab()];
    this.deletingId.set(item.id);

    config.remove(item.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.notification.show(`Se eliminó "${item.name}"`);
        this.activeResource().reload();
      },
      error: error => {
        this.deletingId.set(null);
        this.notification.show(this.errorMessage(error, `No se pudo eliminar "${item.name}".`), 'error');
      },
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    const apiError = extractApiError(error);
    const mapped = mapApiError(apiError);
    if (mapped.redirect) {
      void this.router.navigate([mapped.redirect]);
      return fallback;
    }
    // En 409 (nombre repetido, proveedor con compras) el motivo concreto viene del backend.
    if (apiError.code === 'CONFLICT') return apiError.message || fallback;
    const message = mapped.fields ? Object.values(mapped.fields).join(' · ') : mapped.toast;
    return message || apiError.message || fallback;
  }
}
