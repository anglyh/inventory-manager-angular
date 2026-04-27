import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MovementForm } from "@inventory-movements/components/movement-form/movement-form";
import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'new-sale-page',
  imports: [MovementForm, Button],
  templateUrl: './new-sale-page.html',
})
export class NewSalePage {
  private router = inject(Router);
  
  goBackToSales() {
    this.router.navigate(['/sales']);
  }
}
