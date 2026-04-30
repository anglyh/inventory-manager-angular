import { NgStyle } from '@angular/common';
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
  imports: [Button, NgStyle],
  templateUrl: './option-selector.html',
})
export class OptionSelector<T extends Option> {
  private hostElement = inject(ElementRef)
  private document = inject(DOCUMENT)

  isDropdownOpen = signal(false);
  /** Si no hay espacio abajo, el dropdown se abre hacia arriba. */
  dropUp = signal(false);
  /** Posición fija para evitar recortes por overflow en modales. */
  dropdownStyle = signal<Record<string, string>>({});
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
        const target = event.target as Node | null;
        const clickInside = target ? this.hostElement.nativeElement.contains(target) : false;
        if (!clickInside) {
          this.isDropdownOpen.set(false)
        }
      })

    // Recalcular posición cuando el viewport cambia (solo si está abierto).
    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.isDropdownOpen()) this.updateDropdownPosition();
      });

    // Captura scrolls en contenedores (incluye modales con overflow).
    fromEvent(window, 'scroll', { capture: true } as any)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.isDropdownOpen()) this.updateDropdownPosition();
      });
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
    if (this.isDropdownOpen()) this.updateDropdownPosition();

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

  openDropdown() {
    this.isDropdownOpen.set(true);
    this.updateDropdownPosition();
  }

  private updateDropdownPosition() {
    const el: HTMLElement | null = this.hostElement?.nativeElement ?? null;
    if (!el) return;

    const input = el.querySelector('input') as HTMLInputElement | null;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const gap = 4; // px
    const maxHeight = 18 * 16; // 18rem aprox (288px)

    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    const shouldDropUp = spaceBelow < Math.min(maxHeight, 240) && spaceAbove > spaceBelow;
    this.dropUp.set(shouldDropUp);

    const width = `${rect.width}px`;
    const left = `${rect.left}px`;

    if (shouldDropUp) {
      const bottom = `${window.innerHeight - rect.top + gap}px`;
      this.dropdownStyle.set({ position: 'fixed', left, bottom, width, zIndex: '9999' });
    } else {
      const top = `${rect.bottom + gap}px`;
      this.dropdownStyle.set({ position: 'fixed', left, top, width, zIndex: '9999' });
    }
  }
}
