import { NgStyle } from '@angular/common';
import { Component, computed, DOCUMENT, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerPlus, tablerSearch } from '@ng-icons/tabler-icons';
import { Button } from 'src/app/shared/components/button/button';

interface Option {
  id: string;
  name: string;
}

const removeAccents = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // Elimina las tildes
}

/** Para comparar nombres: sin tildes, mayúsculas ni espacios sobrantes. */
const normalizeName = (text: string) => removeAccents(text).trim().replace(/\s+/g, ' ');

@Component({
  selector: 'app-option-selector',
  imports: [Button, NgStyle, NgIcon],
  viewProviders: [provideIcons({ tablerPlus, tablerSearch })],
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

  placeholder = input('Busca una opción...');
  emptyText = input('No hay coincidencias');

  /**
   * `add`: cada elección agrega un elemento; el buscador se limpia y conserva el
   * foco para seguir agregando. `select`: el texto elegido queda en el input.
   */
  mode = input<'select' | 'add'>('select');

  /** Ofrece crear el texto escrito cuando no coincide exactamente con ninguna opción. */
  creatable = input(false);
  createLabel = input('Crear');
  /** El padre está creando o guardando: el input se bloquea con un indicador. */
  busy = input(false);

  selectedOption = output<T | null>();
  selectionCleared = output();
  createRequested = output<string>();

  items = input<T[]>([])

  /** Opción resaltada con el teclado; el índice `filteredOptions().length` es la de crear. */
  activeIndex = signal(-1);

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
      return;
    }

    // El padre eligió lo que ya está escrito (p. ej. tras crearlo): queda como selección.
    if (selected && selected === current && !this.lastSelectedName()) {
      this.lastSelectedName.set(selected);
    }
  });

  /** Mantiene visible la opción resaltada al recorrer la lista con flechas. */
  private dropdownRef = viewChild<ElementRef<HTMLElement>>('dropdown');

  /**
   * El dropdown es un popover nativo: se dibuja en la top layer, por encima de
   * los <dialog> y sin que lo recorten el overflow ni los transform de ancestros.
   */
  popoverEffect = effect(() => {
    const dropdown = this.dropdownRef()?.nativeElement;
    if (!dropdown) return;
    const isShown = dropdown.matches(':popover-open');
    if (this.isDropdownOpen() && !isShown) dropdown.showPopover();
    if (!this.isDropdownOpen() && isShown) dropdown.hidePopover();
  });

  scrollActiveEffect = effect(() => {
    const index = this.activeIndex();
    if (index < 0) return;
    this.document.getElementById(this.optionId(index))?.scrollIntoView({ block: 'nearest' });
  });

  constructor() {
    fromEvent(this.document, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        const target = event.target as Node | null;
        const clickInside = target ? this.hostElement.nativeElement.contains(target) : false;
        if (!clickInside) {
          this.closeDropdown()
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

  createText = computed(() => this.inputValue().trim());

  showCreate = computed(() => {
    const query = normalizeName(this.inputValue());
    if (!this.creatable() || !query) return false;
    return !this.items().some(item => normalizeName(item.name) === query);
  });

  private optionsCount = computed(() => this.filteredOptions().length + (this.showCreate() ? 1 : 0));

  optionId(index: number): string {
    return `${this.controlId()}-option-${index}`;
  }

  onSelectOption(item: T) {
    this.selectedOption.emit(item)

    if (this.mode() === 'add') {
      this.inputValue.set('')
      this.activeIndex.set(-1)
      return
    }

    this.lastSelectedName.set(item.name)
    this.inputValue.set(item.name)
    this.closeDropdown()
  }

  onCreate() {
    const text = this.createText();
    if (!text || this.busy()) return;
    this.createRequested.emit(text);
    this.closeDropdown();
  }

  /**
   * Enter elige la opción resaltada y evita enviar el formulario contenedor.
   * Nunca crea: un error de tipeo no debe generar registros sin un clic explícito.
   */
  onEnter(event: Event) {
    event.preventDefault()
    const option = this.filteredOptions()[this.activeIndex()]
    if (this.isDropdownOpen() && option) this.onSelectOption(option)
  }

  onArrow(event: Event, step: 1 | -1) {
    event.preventDefault()
    if (!this.isDropdownOpen()) {
      this.openDropdown()
      return
    }
    const last = this.optionsCount() - 1
    if (last < 0) return
    this.activeIndex.set(Math.min(Math.max(this.activeIndex() + step, 0), last))
  }

  onInput(value: string) {
    this.inputValue.set(value)
    // Al escribir se resalta la primera coincidencia; sin texto, ninguna.
    this.activeIndex.set(value.trim() && this.filteredOptions().length ? 0 : -1)
    if (!this.isDropdownOpen()) this.openDropdown();
    else this.updateDropdownPosition();

    if (this.mode() === 'add') return;

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
    if (this.busy()) return;
    this.isDropdownOpen.set(true);
    this.updateDropdownPosition();
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
    this.activeIndex.set(-1);
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
      this.dropdownStyle.set({ position: 'fixed', left, bottom, width });
    } else {
      const top = `${rect.bottom + gap}px`;
      this.dropdownStyle.set({ position: 'fixed', left, top, width });
    }
  }
}
