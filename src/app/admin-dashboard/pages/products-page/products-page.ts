import { Component, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ProductService } from '@/products/services/product.service';
import { Pagination } from "@/shared/components/pagination/pagination";
import { ActivatedRoute } from '@angular/router';
import { ProductTable } from '@/products/components/product-table/product-table';
import { PaginationService } from '@/shared/components/pagination/pagination.service';
import { map } from 'rxjs';
import { ProductForm } from "@/products/components/product-form/product-form";
import { Modal } from "@/shared/components/modal/modal";
import { SearchProduct } from "@/products/components/search-product-form/search-product-form";

@Component({
  selector: 'app-products-page',
  imports: [ProductTable, Pagination, ProductForm, Modal, SearchProduct],
  templateUrl: './products-page.html',
})
export class ProductsPage {
  private productService = inject(ProductService)
  paginationService = inject(PaginationService)
  activatedRoute = inject(ActivatedRoute)

  searchTerm = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map(params => params.get('searchTerm') ?? '')
    ),
    {
      initialValue: ''
    }
  )

  productsPerPage = signal(12);

  productResource = rxResource({
    params: () => ({ 
      page: this.paginationService.currentPage(),
      limit: this.productsPerPage(),
      searchTerm: this.searchTerm()
    }),
    stream: ({ params }) => { 
      return this.productService.getProducts({
        page: params.page,
        limit: params.limit,
        searchTerm: params.searchTerm
      })
    }
  })

}
