import { DecimalPipe } from '@angular/common';
import { Component, computed, DOCUMENT, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerHistory, tablerPackage, tablerScan, tablerTrash } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { BarcodeScanner } from '@/features/products/components/barcode-scanner/barcode-scanner';
import { OptionSelector } from '@/shared/components/option-selector/option-selector';
import { injectRowFlash } from '@/shared/utils/row-flash';
import type { ProductOption } from '@/features/products/interfaces/product.interface';
import type { Supplier } from '@/features/suppliers/interfaces/supplier.interface';
import { SupplierSelector } from '@/features/suppliers/components/supplier-selector/supplier-selector';
import type { CreatePurchaseRequest } from '../../interfaces/purchase.interface';
import { controlError, itemsRequired, lineCents, moneyValidator, quantityValidator } from '../../shared/movement-form-utils';

@Component({
  selector: 'purchase-form',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, Button, OptionSelector, SupplierSelector, NgIcon, BarcodeScanner],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerHistory, tablerPackage, tablerScan, tablerTrash })],
  templateUrl: './purchase-form.html',
  host: { class: 'flex min-h-full flex-col' },
})
export class PurchaseForm {
  private fb = inject(FormBuilder);
  private document = inject(DOCUMENT);
  private notificationService = inject(GlobalNotificationService);
  private flashRow = injectRowFlash();

  scannerOpen = signal(false);

  products = input<ProductOption[]>([]);
  suppliers = input<Supplier[]>([]);
  saving = input(false);
  creatingSupplier = input(false);
  supplierError = input<string | null>(null);
  /** Proveedor recién creado por el padre: queda seleccionado en la compra. */
  createdSupplier = input<Supplier | null>(null);

  submitted = output<CreatePurchaseRequest>();
  supplierCreateRequested = output<string>();

  readonly controlError = controlError;

  purchaseForm = this.fb.nonNullable.group({
    supplierId: [''],
    notes: ['', [Validators.maxLength(500)]],
    items: this.fb.array<ReturnType<PurchaseForm['createItem']>>([], [itemsRequired]),
  });

  private formValue = toSignal(this.purchaseForm.valueChanges, { initialValue: this.purchaseForm.value });

  supplierId = computed(() => this.formValue().supplierId || null);

  selectCreatedSupplier = effect(() => {
    const supplier = this.createdSupplier();
    if (supplier) this.setSupplier(supplier.id);
  });

  setSupplier(id: string | null) {
    this.purchaseForm.controls.supplierId.setValue(id ?? '');
  }

  totalCents = computed(() =>
    (this.formValue().items ?? []).reduce(
      (sum, item) => sum + lineCents(item.unitCost ?? null, item.quantity ?? null), 0)
  );

  totalUnits = computed(() =>
    (this.formValue().items ?? []).reduce(
      (sum, item) => sum + (Number.isSafeInteger(item.quantity) ? item.quantity! : 0), 0)
  );

  notesLength = computed(() => this.formValue().notes?.length ?? 0);

  /** Solo cuenta filas ya tocadas, para no alarmar antes de interactuar. */
  get invalidItemsCount(): number {
    return this.items.controls.filter(item => item.touched && item.invalid).length;
  }

  private salePrices = computed(() =>
    new Map(this.products().map(product => [product.id, Number(product.salePrice)]))
  );

  salePrice(productId: string): number | null {
    return this.salePrices().get(productId) ?? null;
  }

  /** El costo supera el precio de venta: la compra dejaría pérdida por unidad. */
  isAboveSalePrice(index: number): boolean {
    const { productId, unitCost } = this.items.at(index).getRawValue();
    const salePrice = this.salePrice(productId);
    return unitCost !== null && salePrice !== null && unitCost > salePrice;
  }

  get items() {
    return this.purchaseForm.controls.items;
  }

  createItem(product: ProductOption) {
    return this.fb.group({
      productId: this.fb.nonNullable.control(product.id),
      name: this.fb.nonNullable.control(product.name),
      unitCost: this.fb.control<number | null>(null, [Validators.required, moneyValidator]),
      quantity: this.fb.control<number | null>(1, [Validators.required, quantityValidator]),
    });
  }

  lineTotal(index: number): number {
    const { unitCost, quantity } = this.items.at(index).getRawValue();
    return lineCents(unitCost, quantity) / 100;
  }

  addProduct(product: ProductOption | null) {
    if (!product) return;
    this.flashRow(product.id);

    const existing = this.items.controls.find(item => item.controls.productId.value === product.id);
    if (existing) {
      const quantity = existing.controls.quantity;
      quantity.setValue((quantity.value ?? 0) + 1);
      return;
    }

    this.items.push(this.createItem(product));
  }

  /** Código leído con la cámara. Los productos nuevos se registran en Productos, no desde la compra. */
  addByBarcode(code: string) {
    const product = this.products().find(option => option.barcode === code);
    if (!product) {
      this.notificationService.show(`No tienes un producto con el código ${code}. Regístralo en Productos.`, 'error');
      return;
    }
    this.addProduct(product);
    this.notificationService.show(`${product.name} agregado`);
  }

  focusProductSearch() {
    this.document.getElementById('purchase-product')?.focus();
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  onSubmit() {
    if (this.saving()) return;
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    const { supplierId, notes, items } = this.purchaseForm.getRawValue();
    const request: CreatePurchaseRequest = {
      items: items.map(({ productId, unitCost, quantity }) => ({
        productId,
        unitCost: unitCost!,
        quantity: quantity!,
      })),
    };
    if (supplierId) request.supplierId = supplierId;
    if (notes.trim()) request.notes = notes.trim();

    this.submitted.emit(request);
  }
}
