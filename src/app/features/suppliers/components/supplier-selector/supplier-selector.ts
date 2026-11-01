import { Component, computed, input, output } from '@angular/core';
import { OptionSelector } from '@/shared/components/option-selector/option-selector';
import type { Supplier } from '../../interfaces/supplier.interface';

/** Elige un proveedor u ofrece crearlo con el nombre escrito. No hace HTTP. */
@Component({
  selector: 'supplier-selector',
  imports: [OptionSelector],
  templateUrl: './supplier-selector.html',
})
export class SupplierSelector {
  suppliers = input<Supplier[]>([]);
  selectedId = input<string | null>(null);
  creating = input(false);
  controlId = input('supplier-selector');

  supplierChange = output<string | null>();
  createRequested = output<string>();

  selectedName = computed(() => {
    const id = this.selectedId();
    return id ? this.suppliers().find(supplier => supplier.id === id)?.name ?? '' : '';
  });

  onSelected(supplier: Supplier | null) {
    if (supplier) this.supplierChange.emit(supplier.id);
  }
}
