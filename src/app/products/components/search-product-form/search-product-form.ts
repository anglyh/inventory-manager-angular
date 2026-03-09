import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'search-product-form',
  imports: [],
  templateUrl: './search-product-form.html',
})
export class SearchProduct {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  search(productName: string) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { searchTerm: productName || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }
}
