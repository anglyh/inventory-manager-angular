import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MovementForm } from "@inventory-movements/components/movement-form/movement-form";

@Component({
  selector: 'new-sale-page',
  imports: [MovementForm],
  templateUrl: './new-sale-page.html',
})
export class NewSalePage {
  private router = inject(Router);
  
  goBackToSales() {
    this.router.navigate(['/sales']);
  }
}
