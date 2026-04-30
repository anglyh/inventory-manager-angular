import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, input, output, signal, ElementRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { Category } from '@/categories/interfaces/category.interface';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerFilter } from '@ng-icons/tabler-icons';

@Component({
  selector: 'category-multiselect-filter',
  imports: [NgIcon],
  viewProviders: [provideIcons({ tablerFilter })],
  templateUrl: './category-multiselect-filter.html',
})
export class CategoryMultiselectFilter {
  categories = input<Category[]>([]);
  /** Query param raw: "Bebidas,Snacks" (puede venir vacío). */
  value = input<string>('');

  /** `null` => no enviar query param category. */
  valueChange = output<string | null>();

  isOpen = signal(false);
  private el = inject(ElementRef);
  private document = inject(DOCUMENT);

  constructor() {
    fromEvent(this.document, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        const target = event.target as Node | null;
        const clickInside = target ? this.el.nativeElement.contains(target) : false;
        if (!clickInside && this.isOpen()) {
          this.isOpen.set(false);
        }
      });
  }

  /** Selección editable dentro del dropdown (normalizada). */
  private selectedNorm = signal<Set<string>>(new Set());
  /** Conserva el texto original para categorías "desconocidas" (si venían en URL). */
  private unknownRawByNorm = signal<Map<string, string>>(new Map());

  /** Sincroniza estado interno cuando cambia el query param. */
  syncEffect = effect(() => {
    const parsed = parseCategoryParam(this.value());
    this.selectedNorm.set(new Set(parsed.norms));
    this.unknownRawByNorm.set(new Map(parsed.unknownRawByNorm));
  });

  selectedCount = computed(() => this.selectedNorm().size);

  selectedDisplay = computed(() => {
    const map = buildNameMap(this.categories());
    const names = Array.from(this.selectedNorm()).map(n => {
      return map.get(n) ?? this.unknownRawByNorm().get(n) ?? '';
    }).filter(Boolean);
    return names;
  });

  isChecked(categoryName: string): boolean {
    return this.selectedNorm().has(normalizeText(categoryName));
  }

  toggleCategory(category: Category) {
    const norm = normalizeText(category.name);
    const next = new Set(this.selectedNorm());
    if (next.has(norm)) next.delete(norm);
    else next.add(norm);
    this.selectedNorm.set(next);
  }

  clearAll() {
    this.selectedNorm.set(new Set());
    this.unknownRawByNorm.set(new Map());
    this.apply();
  }

  apply() {
    const map = buildNameMap(this.categories());
    const names = Array.from(this.selectedNorm())
      .map(n => map.get(n) ?? this.unknownRawByNorm().get(n) ?? '')
      .map(s => s.trim())
      .filter(Boolean);

    const joined = names.join(',');
    this.valueChange.emit(joined ? joined : null);
    this.isOpen.set(false);
  }
}

function parseCategoryParam(raw: string) {
  const parts = (raw ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const norms: string[] = [];
  const unknownRawByNorm = new Map<string, string>();

  for (const p of parts) {
    const n = normalizeText(p);
    if (!n) continue;
    norms.push(n);
    // Guardamos el raw por si no existe en la lista al momento de pintar.
    if (!unknownRawByNorm.has(n)) unknownRawByNorm.set(n, p);
  }

  return { norms: Array.from(new Set(norms)), unknownRawByNorm };
}

function buildNameMap(categories: Category[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of categories ?? []) {
    map.set(normalizeText(c.name), c.name);
  }
  return map;
}

function normalizeText(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

