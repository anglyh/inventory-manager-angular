import { ProductService } from '@/features/products/services/product.service';
import { Component, ElementRef, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BarcodeLookup, BarcodeSuggestion, ProductUpsertBody, ProductWithStock } from '@/features/products/interfaces/product.interface';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Button } from 'src/app/shared/components/button/button';
import { GlobalNotificationService } from 'src/app/shared/components/global-notification/global-notification.service';
import { CategoryService } from '@/features/categories/services/category.service';
import { CategorySelector } from '@/features/categories/components/category-selector/category-selector';
import { extractApiError } from '@/api/extract-api-error';
import { mapApiError } from '@/api/error-mapper';
import { resolveApiError } from '@/shared/utils/api-error';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerScan } from '@ng-icons/tabler-icons';
import { BarcodeScanner } from '@/features/products/components/barcode-scanner/barcode-scanner';
import { isValidGtin } from '@/features/products/utils/gtin';

const SOURCE_LABEL: Record<BarcodeSuggestion['source'], string> = {
  OPEN_FOOD_FACTS: 'Open Food Facts',
  OPEN_PRODUCTS_FACTS: 'Open Products Facts',
  OPEN_BEAUTY_FACTS: 'Open Beauty Facts',
};

@Component({
  selector: 'product-form',
  imports: [ReactiveFormsModule, Button, CategorySelector, NgIcon, BarcodeScanner],
  viewProviders: [provideIcons({ tablerScan })],
  templateUrl: './product-form.html',
})
export class ProductForm {
  private fb = inject(FormBuilder)
  private productService = inject(ProductService)
  private categoryService = inject(CategoryService)
  private globalNotification = inject(GlobalNotificationService)

  isSubmitting = signal(false)

  categoriesResource = rxResource({
    params: () => ({}),
    stream: () => this.categoryService.list(),
  })
  categories = computed(() => this.categoriesResource.value() ?? []);

  creatingCategory = signal(false)
  categoryError = signal<string | null>(null)

  onSuccess = output();
  onCancel = output();

  productInitialData = input<Partial<ProductWithStock> | null>(null)
  /** Resultado de una búsqueda por código hecha antes de abrir el formulario (escaneo desde la página). */
  initialLookup = input<BarcodeLookup | null>(null)
  /** Se pidió editar el producto que ya tiene el código buscado. */
  editExisting = output<string>()
  productForm = this.fb.group({
    name: ['', [Validators.required]],
    barcode: [''],
    salePrice: [1, [Validators.min(0.01), Validators.required]],
    minStock: [10, [Validators.min(0), Validators.required]],
    categoryId: [null as string | null],
  })

  categoryId = toSignal(this.productForm.controls.categoryId.valueChanges, {
    initialValue: this.productForm.controls.categoryId.value,
  })

  // --- Código de barras: escáner, lector de mano (dígitos + Enter) y datos sugeridos ---
  private barcodeInput = viewChild<ElementRef<HTMLInputElement>>('barcodeInput')
  scannerOpen = signal(false)
  lookingUp = signal(false)
  barcodeError = signal<string | null>(null)
  private lookup = signal<BarcodeLookup | null>(null)
  private barcodeValue = toSignal(this.productForm.controls.barcode.valueChanges, {
    initialValue: this.productForm.controls.barcode.value,
  })

  /** Solo vale mientras el campo conserva el código buscado. */
  visibleLookup = computed(() => {
    const lookup = this.lookup()
    return lookup && lookup.code === (this.barcodeValue() ?? '').trim() ? lookup : null
  })
  suggestion = computed(() => this.visibleLookup()?.suggestion ?? null)
  sourceLabel = computed(() => {
    const source = this.suggestion()?.source
    return source ? SOURCE_LABEL[source] : ''
  })
  /** Otro producto de la tienda ya usa el código (el que se edita no cuenta). */
  existingProduct = computed(() => {
    const existing = this.visibleLookup()?.existingProduct
    return existing && existing.id !== this.productInitialData()?.id ? existing : null
  })
  notFound = computed(() => {
    const lookup = this.visibleLookup()
    return Boolean(lookup && !lookup.existingProduct && !lookup.suggestion)
  })

  /** Lector de mano: escribe los dígitos y Enter. El Enter busca el código en vez de guardar. */
  onBarcodeEnter(event: Event) {
    event.preventDefault()
    this.lookupBarcode()
  }

  onScanned(code: string) {
    this.productForm.controls.barcode.setValue(code)
    this.lookupBarcode()
  }

  focusBarcode() {
    this.barcodeInput()?.nativeElement.focus()
  }

  lookupBarcode() {
    const code = (this.productForm.controls.barcode.value ?? '').trim()
    this.barcodeError.set(null)
    if (!code || this.lookingUp()) return
    if (!isValidGtin(code)) {
      this.barcodeError.set('Este código no es válido. Revisa los dígitos.')
      return
    }

    this.lookingUp.set(true)
    this.productService
      .lookupBarcode(code)
      .pipe(finalize(() => this.lookingUp.set(false)))
      .subscribe({
        next: lookup => {
          this.lookup.set(lookup)
          this.applySuggestion(lookup)
        },
        error: error => {
          this.globalNotification.show(resolveApiError(error, 'No se pudo buscar el código.').message, 'error')
        },
      })
  }

  /** Completa solo los campos vacíos: nunca pisa lo que la persona ya escribió. */
  private applySuggestion(lookup: BarcodeLookup | null) {
    if (!lookup) return
    const { name, barcode } = this.productForm.controls
    if (!(barcode.value ?? '').trim()) barcode.setValue(lookup.code)
    if (lookup.suggestion && !(name.value ?? '').trim()) name.setValue(lookup.suggestion.name)
  }

  setCategory(id: string | null) {
    this.productForm.controls.categoryId.setValue(id)
  }

  createCategory(name: string) {
    this.creatingCategory.set(true)
    this.categoryError.set(null)

    this.categoryService
      .create({ name })
      .pipe(finalize(() => this.creatingCategory.set(false)))
      .subscribe({
        next: category => {
          // Se agrega a la lista local: recargar todas las categorías no aporta nada.
          this.categoriesResource.update(list =>
            [...(list ?? []), category].sort((a, b) => a.name.localeCompare(b.name))
          )
          this.setCategory(category.id)
          this.globalNotification.show('Categoría creada', 'success')
        },
        error: error => {
          const apiError = extractApiError(error)
          const mapped = mapApiError(apiError)
          const message = mapped.fields ? Object.values(mapped.fields).join(' · ') : mapped.toast
          this.categoryError.set(message || apiError.message || 'No se pudo crear la categoría.')
        },
      })
  }

  formEffect = effect(() => {
    const salePrice = this.productInitialData()?.salePrice;
    const rawCategoryId = this.productInitialData()?.categoryId;
    const categoryId =
      rawCategoryId == null || String(rawCategoryId).trim() === '' ? null : String(rawCategoryId);
    this.productForm.patchValue({
      name: this.productInitialData()?.name ?? '',
      barcode: this.productInitialData()?.barcode ?? '',
      salePrice: salePrice != null ? Number(salePrice) : 1,
      minStock: this.productInitialData()?.minStock ?? 10,
      categoryId
    })

    const lookup = this.initialLookup()
    untracked(() => {
      this.barcodeError.set(null)
      this.lookup.set(lookup)
      this.applySuggestion(lookup)
    })
  })

  onSubmit() {
    if (this.productForm.invalid) return

    const { name, barcode, salePrice, minStock, categoryId } = this.productForm.value
    if (name == null || salePrice == null || minStock == null) return
    if (Number(salePrice) <= 0) return

    const cleanedBarcode = (barcode ?? '').trim();

    const payload: ProductUpsertBody = {
      name,
      salePrice,
      minStock,
      categoryId: categoryId ?? null,
      ...(cleanedBarcode ? { barcode: cleanedBarcode } : {}),
    }

    const id = this.productInitialData()?.id
    const isEdit = Boolean(id)
    const request$ = id
      ? this.productService.updateProduct(id, payload)
      : this.productService.createProduct(payload)

    this.isSubmitting.set(true)

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.globalNotification.show(
            isEdit ? 'Producto actualizado' : 'Producto creado',
            'success',
          )
          this.onSuccess.emit()
        },
        error: () => {
          this.globalNotification.show(
            isEdit ? 'No se pudo actualizar el producto' : 'No se pudo crear el producto',
            'error',
          )
        },
      })
  }
}
