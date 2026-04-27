import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { InventoryMovement } from 'src/app/inventory-movements/interfaces/inventory-movement.interface';
import { InventoryMovementService } from 'src/app/inventory-movements/services/inventory-movement.service';
import { InventoryMovementList } from '../../../inventory-movements/components/inventory-movement-list/inventory-movement-list';
import { RouterLink } from '@angular/router';
import { Button } from 'src/app/shared/components/button/button';

@Component({
  selector: 'app-sales-page',
  imports: [InventoryMovementList, RouterLink, Button],
  templateUrl: './sales-page.html',
})
export class SalesPage implements OnInit {
  #movementService = inject(InventoryMovementService)

  movements = signal<InventoryMovement[]>([]);
  nextCursor = signal<{ cursorId: string; cursorDate: string } | null>(null)
  isLoading = signal(false);
  hasNextPage = signal(true)
  private readonly LIMIT = 12;

  
  ngOnInit(): void {
    this.loadMore()
  }

  loadMore() {
    if (this.isLoading() || !this.hasNextPage()) return

    this.isLoading.set(true)

    this.#movementService.getExits({
      limit: this.LIMIT,
      cursorDate: this.nextCursor()?.cursorDate,
      cursorId: this.nextCursor()?.cursorId
    })
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: response => {
          this.movements.update(prev => [...prev, ...response.data])

          if (response.nextCursor) {
            this.nextCursor.set({ 
              cursorDate: response.nextCursor.cursorDate,
              cursorId: response.nextCursor.cursorId 
            })
          } else {
            this.nextCursor.set(null)
            this.hasNextPage.set(false)
          }
        },
        error: (err) => {
          console.error('Error cargando ventas', err)
        }
      })
  }
}
