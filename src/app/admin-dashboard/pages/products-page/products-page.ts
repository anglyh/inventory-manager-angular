import { map } from 'rxjs';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { tablerChevronDown, tablerPlus, tablerTable } from '@ng-icons/tabler-icons';
import { AuthService } from '@/auth/services/auth.service';

import { CategoryMultiselectFilter, NO_CATEGORY } from '@/features/categories/components/category-multiselect-filter/category-multiselect-filter';
import { CategoryService } from '@/features/categories/services/category.service';
import { Category } from '@/features/categories/interfaces/category.interface';
import { ProductForm } from "@/features/products/components/product-form/product-form";
import { ProductTable } from '@/features/products/components/product-table/product-table';
import { ProductWithStock } from '@/features/products/interfaces/product.interface';
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
  imports: [ProductTable, Pagination, ProductForm, Modal, SearchProduct, NgIcon, CategoryMultiselectFilter, ModuleTabs, Button],
  viewProviders: [provideIcons({ tablerPlus, tablerTable, tablerChevronDown })],
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

  isModalOpen = signal(false);

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

  openModal(product: Partial<ProductWithStock>) {
    this.selectedProduct.set(product);
    this.isModalOpen.set(true)
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
