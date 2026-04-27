import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryMovementService } from 'src/app/inventory-movements/services/inventory-movement.service';
import { InventoryMovementList } from "src/app/inventory-movements/components/inventory-movement-list/inventory-movement-list";
import { InventoryMovement } from 'src/app/inventory-movements/interfaces/inventory-movement.interface';
import { finalize } from 'rxjs';
import { InfiniteScrollDirective } from '@/shared/directives/infinite-scroll.directive';
import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'app-purchases-page',
  imports: [RouterLink, ReactiveFormsModule, InventoryMovementList, InfiniteScrollDirective, Button],
  templateUrl: './purchases-page.html',
})
export class PurchasesPage implements OnInit {
  #movementService = inject(InventoryMovementService)

  movements = signal<InventoryMovement[]>([]);
  nextCursor = signal<{ cursorId: string; cursorDate: string } | null>(null)
  isLoading = signal(false);
  hasNextPage = signal(true)
  private readonly LIMIT = 12;

  ngOnInit(): void {
    this.loadMore()
  }

  loadMore(): void {
    if (this.isLoading() || !this.hasNextPage()) return;

    this.isLoading.set(true);

    this.#movementService.getEntries({ 
      cursorId: this.nextCursor()?.cursorId,
      cursorDate: this.nextCursor()?.cursorDate,
      limit: this.LIMIT
    })
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.movements.update(prev => [...prev, ...response.data]);
          
          if (response.nextCursor) {
            this.nextCursor.set({ 
              cursorDate: response.nextCursor.cursorDate, 
              cursorId: response.nextCursor.cursorId 
            });
          } else {
            this.nextCursor.set(null);
            this.hasNextPage.set(false);
          }
        },
        error: (err) => {
          console.error('Error cargando compras', err)
        }
      })
  }

}
