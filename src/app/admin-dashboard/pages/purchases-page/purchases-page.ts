import { Component, inject, signal } from '@angular/core';
import { Modal } from "@/shared/components/modal/modal";
import { PurchaseForm } from "@/purchases/components/purchase-form/purchase-form";
import { PurchaseService } from '@/purchases/services/purchase.service';
import { PaginationService } from '@/shared/components/pagination/pagination.service';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-purchases-page',
  imports: [Modal, PurchaseForm],
  templateUrl: './purchases-page.html',
})
export class PurchasesPage {
  private purchaseService = inject(PurchaseService)
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

  purchaseResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.productsPerPage(),
      searchTerm: this.searchTerm()
    }),
    stream: ({ params }) => {
      return this.purchaseService.getPurchases()
    }
  })
}
