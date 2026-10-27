import { finalize, map } from 'rxjs';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { tablerChevronDown, tablerPlus, tablerScan } from '@ng-icons/tabler-icons';
import { AuthService } from '@/auth/services/auth.service';

import { CategoryMultiselectFilter, NO_CATEGORY } from '@/features/categories/components/category-multiselect-filter/category-multiselect-filter';
import { CategoryService } from '@/features/categories/services/category.service';
import { Category } from '@/features/categories/interfaces/category.interface';
import { ProductForm } from "@/features/products/components/product-form/product-form";
import { ProductTable } from '@/features/products/components/product-table/product-table';
import { BarcodeLookup, ProductWithStock } from '@/features/products/interfaces/product.interface';
import { BarcodeScanner } from '@/features/products/components/barcode-scanner/barcode-scanner';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';
import { ProductService } from '@/features/products/services/product.service';
import { SearchProduct } from "@/features/products/components/search-product-form/search-product-form";
import { Modal } from "@/shared/components/modal/modal";
import { Button } from '@/shared/components/button/button';
import { Pagination } from "@/shared/components/pagination/pagination";
import { PaginationService } from '@/shared/components/pagination/pagination.service';
import { ModuleTabs } from '@/shared/components/module-tabs/module-tabs';
import { PRODUCTS_TABS } from '@/admin-dashboard/module-tabs';

@Component({
  selector: 'app-products-page',
  imports: [ProductTable, Pagination, ProductForm, Modal, SearchProduct, NgIcon, CategoryMultiselectFilter, ModuleTabs, Button, BarcodeScanner],
  viewProviders: [provideIcons({ tablerPlus, tablerChevronDown, tablerScan })],
  templateUrl: './products-page.html',
})
export class ProductsPage {
  readonly isAdmin = inject(AuthService).isAdmin;
  readonly moduleTabs = PRODUCTS_TABS;
  private productService = inject(ProductService)
  private categoryService = inject(CategoryService)
  paginationService = inject(PaginationService)
  activatedRoute = inject(ActivatedRoute)
  private router = inject(Router)
  private notification = inject(GlobalNotificationService)

  isModalOpen = signal(false);
  /** Búsqueda por código que abre el formulario (escaneo); el formulario completa los campos vacíos. */
  initialLookup = signal<BarcodeLookup | null>(null);
  scannerOpen = signal(false);
  lookingUp = signal(false);

  searchTerm = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map(params => params.get('searchTerm') ?? '')
    ),
    { initialValue: '' }
  )

  /** Query param `categoryId`: ids separados por coma; "none" = sin categoría. */
  private categoryParam = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map(params => params.get('categoryId') ?? '')
    ),
    { initialValue: '' }
  )

  /** Ids válidos del URL: lo que no es UUID ni "none" se ignora (el API lo rechazaría). */
  selectedCategoryIds = computed(() => [...new Set(
    this.categoryParam().split(',').map(id => id.trim()).filter(id => id === NO_CATEGORY || UUID.test(id))
  )])

  categoriesResource = rxResource({
    params: () => ({}),
    stream: () => this.categoryService.list(),
  })
  categories = computed(() => this.categoriesResource.value() ?? ([] as Category[]))

  readonly pageSizes = [10, 20, 30, 40, 50];
  productsPerPage = signal(10);
  selectedProduct = signal<Partial<ProductWithStock>>({
    name: '',
    salePrice: '',
    minStock: 10,
    categoryId: null
  });
  // productModal = viewChild<Modal>('productModal');

  openModal(product: Partial<ProductWithStock>, lookup: BarcodeLookup | null = null) {
    this.selectedProduct.set(product);
    this.initialLookup.set(lookup);
    this.isModalOpen.set(true)
  }

  /** Escaneo: si el código ya es de un producto se edita ese; si no, se abre uno nuevo con lo sugerido. */
  onScanned(code: string) {
    this.lookingUp.set(true);
    this.productService
      .lookupBarcode(code)
      .pipe(finalize(() => this.lookingUp.set(false)))
      .subscribe({
        next: lookup => {
          if (lookup.existingProduct) {
            this.notification.show(`Ya tienes «${lookup.existingProduct.name}» con ese código`);
            this.editProduct(lookup.existingProduct.id);
          } else {
            this.openModal({ barcode: lookup.code }, lookup);
          }
        },
        error: error => this.notification.show(resolveApiError(error, 'No se pudo buscar el código.').message, 'error'),
      });
  }

  /** Abre la edición de un producto que no está en la página actual de la tabla. */
  editProduct(id: string) {
    this.productService.getProductById(id).subscribe({
      next: product => this.openModal(product),
      error: error => this.notification.show(resolveApiError(error, 'No se pudo abrir el producto.').message, 'error'),
    });
  }

  openNewProduct() {
    this.openModal({})
  }

  /** Cambiar cuántos se ven mueve los índices: se vuelve a la primera página. */
  changePageSize(size: number) {
    this.productsPerPage.set(size);
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  /** Los dropdown de daisyUI se cierran al perder el foco: tras elegir, se suelta. */
  blurActive() {
    (document.activeElement as HTMLElement | null)?.blur();
  }

  closeModal() {
    this.isModalOpen.set(false)
  }

  onCategoryChange(ids: string[]) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { categoryId: ids.length ? ids.join(',') : null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  productResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.productsPerPage(),
      searchTerm: this.searchTerm(),
      categoryId: this.selectedCategoryIds().join(',')
    }),
    stream: ({ params }) => {
      return this.productService.getProducts({
        page: params.page,
        limit: params.limit,
        searchTerm: params.searchTerm,
        categoryId: params.categoryId || undefined
      })
    }
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
