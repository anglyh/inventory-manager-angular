import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core'
import { DatePipe, DecimalPipe } from '@angular/common';
import { tablerPackage, tablerChevronDown, tablerClock, tablerBuilding, tablerNotes } from '@ng-icons/tabler-icons';
import { InventoryMovement, MovementItem } from '../../interfaces/inventory-movement.interface';

@Component({
  selector: 'inventory-movement-list',
  imports: [DatePipe, DecimalPipe, NgIcon],
  viewProviders: [provideIcons({ tablerPackage, tablerChevronDown, tablerClock, tablerBuilding, tablerNotes })],
  templateUrl: './inventory-movement-list.html',
})
export class InventoryMovementList {
  movements = input.required<InventoryMovement[]>()
  
  groupedMovements = computed(() => {
    const groups = new Map<string, InventoryMovement[]>();
    for (const movement of this.movements()) {
      const d = new Date(movement.createdAt);
      d.setHours(0, 0, 0, 0);
      const dateKey = d.toISOString().slice(0, 10);
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }

      groups.get(dateKey)!.push(movement)
    }

    return Array.from(groups.entries()).map(([dateKey, items]) => {
      const totalAmount = items.reduce((acc, item) => acc + Number(item.totalAmount), 0);

      return {
        date: new Date(`${dateKey}T00:00:00`),
        items,
        totalAmount
      }
    })
  })

  getProductNames(items: MovementItem[]) {
    return items.map(item => item.productName).join(', ');
  }
}
