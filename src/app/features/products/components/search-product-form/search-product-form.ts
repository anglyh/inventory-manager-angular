import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from "@ng-icons/core"
import { tablerSearch, tablerX } from '@ng-icons/tabler-icons';

@Component({
  selector: 'search-product-form',
  imports: [NgIcon],
  viewProviders: [provideIcons({ tablerSearch, tablerX })],
  templateUrl: './search-product-form.html',
})
export class SearchProduct {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  
  searchTerm = signal(
    this.activatedRoute.snapshot.queryParamMap.get('searchTerm') || ''
  )

  search(productName: string) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { searchTerm: productName || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }
}
