import { Product } from '@/products/interfaces/product.interface';
import { ProductService } from '@/products/services/product.service';
import { Component, computed, DOCUMENT, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

const removeAccents = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Elimina las tildes
}

@Component({
  selector: 'product-selector',
  imports: [],
  templateUrl: './product-selector.html',
})
export class ProductSelector {
  private productService = inject(ProductService);
  private hostElement = inject(ElementRef)
  private document = inject(DOCUMENT)

  dropdown = viewChild('dropdown');
  isDropdownOpen = signal(false);
  inputValue = signal('')
  lastSelectedName = signal('')

  /** Id único por fila cuando hay varios selectores en el mismo formulario. */
  controlId = input('product-input');

  selectedProduct = output<Product | null>();
  selectionCleared = output();

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

  productsListResource = rxResource({
    params: () => ({}),
    stream: () => {
      return this.productService.listProductOptions()
    }
  })

  filteredProducts = computed(() => {
    const allProducts = this.productsListResource.value() || [];
    const cleanQuery = removeAccents(this.inputValue())

    if (!cleanQuery) return allProducts;

    return allProducts.filter(product => {
      const cleanName = removeAccents(product.name)
      return cleanName.includes(cleanQuery)
    })
  })

  onSelectProduct(product: Product) {
    this.lastSelectedName.set(product.name)
    this.selectedProduct.emit(product)
    this.inputValue.set(product.name)
    this.isDropdownOpen.set(false)
  }

  onInput(value: string) {
    this.inputValue.set(value)

    if (this.inputValue().toLowerCase() !== this.lastSelectedName().toLowerCase()) {
      this.lastSelectedName.set('')
      this.selectedProduct.emit(null)
    }
  }

  clearInputValue() {
    this.inputValue.set('')
  }

  filterProducts(productName: string) {
    this.productsListResource.value()?.filter(product => product.name === productName)
  }
}
