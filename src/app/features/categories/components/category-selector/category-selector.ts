import { Component, computed, input, output } from '@angular/core';
import { OptionSelector } from '@/shared/components/option-selector/option-selector';
import type { Category } from '../../interfaces/category.interface';

/** Elige una categoría u ofrece crearla con el nombre escrito. No hace HTTP. */
@Component({
  selector: 'category-selector',
  imports: [OptionSelector],
  templateUrl: './category-selector.html',
})
export class CategorySelector {
  categories = input<Category[]>([]);
  selectedId = input<string | null>(null);
  creating = input(false);
  controlId = input('category-selector');

  categoryChange = output<string | null>();
  createRequested = output<string>();

  selectedName = computed(() => {
    const id = this.selectedId();
    return id ? this.categories().find(category => category.id === id)?.name ?? '' : '';
  });

  onSelected(category: Category | null) {
    if (category) this.categoryChange.emit(category.id);
  }
}
