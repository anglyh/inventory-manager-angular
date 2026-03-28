import { PurchaseService } from '@/purchases/services/purchase.service';
import { PaginationService } from '@/shared/components/pagination/pagination.service';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductSelector } from "@/purchases/components/product-selector/product-selector";

@Component({
  selector: 'app-purchases-page',
  imports: [RouterLink, ProductSelector],
  templateUrl: './purchases-page.html',
})
export class PurchasesPage {
  private purchaseService = inject(PurchaseService)
  paginationService = inject(PaginationService)
  activatedRoute = inject(ActivatedRoute)

  purchasesPerPage = signal(12);

  purchaseResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.purchasesPerPage(),
    }),
    stream: ({ params }) => {
      return this.purchaseService.getPurchases()
    }
  })
}
