import { map } from 'rxjs';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { tablerPlus } from '@ng-icons/tabler-icons';

import { CategoryMultiselectFilter } from '@/categories/components/category-multiselect-filter/category-multiselect-filter';
import { CategoryService } from '@/categories/services/category.service';
import { Category } from '@/categories/interfaces/category.interface';
import { ProductForm } from "@/products/components/product-form/product-form";
import { ProductTable } from '@/products/components/product-table/product-table';
import { ProductWithStock } from '@/products/interfaces/product.interface';
import { ProductService } from '@/products/services/product.service';
import { SearchProduct } from "@/products/components/search-product-form/search-product-form";
import { Modal } from "@/shared/components/modal/modal";
import { Pagination } from "@/shared/components/pagination/pagination";
import { PaginationService } from '@/shared/components/pagination/pagination.service';
import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'app-products-page',
  imports: [ProductTable, Pagination, ProductForm, Modal, SearchProduct, NgIcon, Button, CategoryMultiselectFilter],
  viewProviders: [provideIcons({ tablerPlus })],
  templateUrl: './products-page.html',
})
export class ProductsPage {
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

  categoryFilter = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map(params => params.get('category') ?? '')
    ),
    { initialValue: '' }
  )

  categoriesResource = rxResource({
    params: () => ({}),
    stream: () => this.categoryService.list(),
  })
  categories = computed(() => this.categoriesResource.value() ?? ([] as Category[]))

  productsPerPage = signal(12);
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
    this.openModal({
      name: '',
      salePrice: '0.10',
      minStock: 10,
      categoryId: null
    })
  }

  closeModal() {
    this.isModalOpen.set(false)
  }

  onCategoryChange(value: string | null) {
    const category = (value ?? '').trim() || null;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { category, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  productResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.productsPerPage(),
      searchTerm: this.searchTerm(),
      category: this.categoryFilter()
    }),
    stream: ({ params }) => {
      return this.productService.getProducts({
        page: params.page,
        limit: params.limit,
        searchTerm: params.searchTerm,
        category: params.category || undefined
      })
    }
  })
}
