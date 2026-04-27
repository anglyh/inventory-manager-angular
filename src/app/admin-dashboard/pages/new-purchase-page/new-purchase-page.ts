import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MovementForm } from "@inventory-movements/components/movement-form/movement-form";
import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'new-purchase-page',
  imports: [MovementForm, Button],
  templateUrl: './new-purchase-page.html',
})
export class NewPurchasePage {
  private router = inject(Router);

  goBackToPurchases() {
    this.router.navigate(['/purchases']);
  }
}
