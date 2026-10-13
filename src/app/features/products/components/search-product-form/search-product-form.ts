import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from "@ng-icons/core"
import { tablerX } from '@ng-icons/tabler-icons';
import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'search-product-form',
  imports: [NgIcon, Button],
  viewProviders: [provideIcons({ tablerX })],
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
