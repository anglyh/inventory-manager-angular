import { Component, computed, DOCUMENT, effect, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { Button } from 'src/app/shared/components/button/button';

interface Option {
  id: string;
  name: string;
}

const removeAccents = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Elimina las tildes
}

@Component({
  selector: 'app-option-selector',
  imports: [Button],
  templateUrl: './option-selector.html',
})
export class OptionSelector<T extends Option> {
  private hostElement = inject(ElementRef)
  private document = inject(DOCUMENT)

  isDropdownOpen = signal(false);
  inputValue = signal('')
  lastSelectedName = signal('')

  /** Id único por fila cuando hay varios selectores en el mismo formulario. */
  controlId = input('product-input');

  /** Texto seleccionado desde el padre (p. ej. cuando se setea por escaneo). */
  selectedName = input('');

  selectedOption = output<T | null>();
  selectionCleared = output();

  items = input<T[]>([])

  syncEffect = effect(() => {
    const selected = (this.selectedName() ?? '').trim();
    const current = (this.inputValue() ?? '').trim();

    // Si el padre setea el nombre (escaneo, edición, reset), reflejarlo en el input visual.
    if (selected && selected !== current) {
      this.lastSelectedName.set(selected);
      this.inputValue.set(selected);
      return;
    }

    // Si el padre lo limpió, limpia también el input visual.
    if (!selected && current && this.lastSelectedName()) {
      this.lastSelectedName.set('');
      this.inputValue.set('');
    }
  });

  constructor() {
    fromEvent(this.document, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        const clickInside = this.hostElement.nativeElement.contains(event.target)
        if (!clickInside) {
          this.isDropdownOpen.set(false)
        }
      })
  }
  
  filteredOptions = computed(() => {
    const allProducts = this.items() || [];
    const cleanQuery = removeAccents(this.inputValue())

    if (!cleanQuery) return allProducts;

    return allProducts.filter(product => {
      const cleanName = removeAccents(product.name)
      return cleanName.includes(cleanQuery)
    })
  })

  onSelectOption(item: T) {
    this.lastSelectedName.set(item.name)
    this.selectedOption.emit(item)
    this.inputValue.set(item.name)
    this.isDropdownOpen.set(false)
  }

  filterOptions(itemName: string) {
    this.items().filter(item => item.name === itemName)
  }

  onInput(value: string) {
    this.inputValue.set(value)

    const current = (this.inputValue() ?? '').toLowerCase()
    const lastSelected = (this.lastSelectedName() ?? '').toLowerCase()

    if (current !== lastSelected) {
      const hadSelection = !!this.lastSelectedName()
      this.lastSelectedName.set('')
      this.selectedOption.emit(null)

      if (hadSelection) {
        this.selectionCleared.emit()
      }
    }
  }
}
