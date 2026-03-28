import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PurchaseForm } from "@/purchases/components/purchase-form/purchase-form";

@Component({
  selector: 'new-purchase-form-page',
  imports: [PurchaseForm, RouterLink],
  templateUrl: './new-purchase-form-page.html',
})
export class NewPurchaseFormPage {
  private router = inject(Router);

  goBackToPurchases() {
    this.router.navigate(['/purchases']);
  }
}
