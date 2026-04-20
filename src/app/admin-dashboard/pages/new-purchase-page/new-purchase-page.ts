import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MovementForm } from "@inventory-movements/components/movement-form/movement-form";

@Component({
  selector: 'new-purchase-page',
  imports: [MovementForm, RouterLink],
  templateUrl: './new-purchase-page.html',
})
export class NewPurchasePage {
  private router = inject(Router);

  goBackToPurchases() {
    this.router.navigate(['/purchases']);
  }
}
