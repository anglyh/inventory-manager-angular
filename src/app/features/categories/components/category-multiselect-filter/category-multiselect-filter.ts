import { Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerChevronDown, tablerFilter, tablerX } from '@ng-icons/tabler-icons';
import { Category } from '@/features/categories/interfaces/category.interface';
import { Button } from '@/shared/components/button/button';

/** Valor que pide los productos sin categoría (mismo que entiende el API). */
export const NO_CATEGORY = 'none';

/**
 * Filtro por categorías: cada casilla filtra al instante y lo elegido queda
 * a la vista como chips que se quitan con ✕. El host es `contents`: el
 * botón, los chips y "Limpiar" fluyen en la fila del padre.
 */
@Component({
  selector: 'category-multiselect-filter',
  imports: [NgIcon, Button],
  viewProviders: [provideIcons({ tablerFilter, tablerChevronDown, tablerX })],
  templateUrl: './category-multiselect-filter.html',
  host: { class: 'contents' },
})
export class CategoryMultiselectFilter {
  readonly noCategory = NO_CATEGORY;

  categories = input<Category[]>([]);
  /** Ids elegidos; puede incluir `NO_CATEGORY`. */
  selected = input<string[]>([]);
  selectedChange = output<string[]>();

  private selectedSet = computed(() => new Set(this.selected()));

  /** Chips en el orden de la lista; "Sin categoría" al final. Ids desconocidos no se muestran. */
  chips = computed(() => {
    const selected = this.selectedSet();
    const chips = this.categories()
      .filter(category => selected.has(category.id))
      .map(category => ({ id: category.id, name: category.name }));
    if (selected.has(NO_CATEGORY)) chips.push({ id: NO_CATEGORY, name: 'Sin categoría' });
    return chips;
  });

  isSelected(id: string): boolean {
    return this.selectedSet().has(id);
  }

  toggle(id: string) {
    const next = this.isSelected(id)
      ? this.selected().filter(selectedId => selectedId !== id)
      : [...this.selected(), id];
    this.selectedChange.emit(next);
  }

  clear() {
    this.selectedChange.emit([]);
  }

  /** El dropdown de daisyUI se cierra al perder el foco. */
  close() {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}
