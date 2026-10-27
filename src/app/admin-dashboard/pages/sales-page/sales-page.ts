import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { ProductPicker } from "@/features/products/components/product-picker/product-picker";
import { ProductService } from '@/features/products/services/product.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { SaleDetail } from "src/app/features/inventory-movements/components/sale-detail/sale-detail";
import { ProductOption } from 'src/app/features/products/interfaces/product.interface';
import type { CreateSaleRequest, SaleCartItem } from '@/features/inventory-movements/interfaces/sale.interface';
import { InventoryMovementService } from '@/features/inventory-movements/services/inventory-movement.service';
import type { PaymentMethod } from '@/features/inventory-movements/interfaces/inventory-movement.interface';
import { SaleMapper } from '@/features/inventory-movements/mappers/sale.mapper';
import { GlobalNotificationService } from 'src/app/shared/components/global-notification/global-notification.service';
import { CashRegisterService } from '@/features/cash-register/services/cash-register.service';
import { extractApiError } from '@/api/extract-api-error';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerCashRegister, tablerRefresh, tablerScan } from "@ng-icons/tabler-icons";
import { Button } from "@/shared/components/button/button";
import { BarcodeScanner, type ScanFeedback } from "@/features/products/components/barcode-scanner/barcode-scanner";

/** Las pistolas lectoras teclean cada dígito en pocos milisegundos; una persona tarda más. */
const SCANNER_KEY_GAP_MS = 50;

@Component({
  selector: 'app-sales-page',
  imports: [ProductPicker, SaleDetail, RouterLink, NgIcon, Button, BarcodeScanner],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerCashRegister, tablerRefresh, tablerScan })],
  templateUrl: './sales-page.html',
  host: { '(document:keydown)': 'onScannerKey($event)' },
})
export class SalesPage {
  private scanBuffer = '';
  private lastScanKeyAt = 0;

  /**
   * Pistola lectora con el foco fuera de un campo (p. ej. tras tocar un producto): teclea los dígitos
   * muy rápido y termina con Enter. Una persona tecleando no llega a ese ritmo, así que no se confunde.
   * Dentro de un campo no interviene: el buscador maneja su propio Enter.
   */
  onScannerKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (this.scannerOpen() || target?.closest('input, textarea, select, [contenteditable="true"]')) return;

    const now = performance.now();
    if (now - this.lastScanKeyAt > SCANNER_KEY_GAP_MS) this.scanBuffer = '';
    this.lastScanKeyAt = now;

    if (/^\d$/.test(event.key)) {
      this.scanBuffer += event.key;
      return;
    }
    if (event.key === 'Enter' && /^\d{8,14}$/.test(this.scanBuffer)) {
      // Evita que el Enter también "presione" el botón que tenga el foco.
      event.preventDefault();
      this.addByBarcode(this.scanBuffer);
    }
    this.scanBuffer = '';
  }

  productService = inject(ProductService);
  inventoryMovementService = inject(InventoryMovementService)
  saleOpen = signal(false);
  notificationService = inject(GlobalNotificationService)
  cashRegisterService = inject(CashRegisterService);
  savingSale = signal(false);

  productsResource = rxResource({
    params: () => ({}),
    stream: () => {
      return this.productService.listProductOptions();
    }
  })

  searchTerm = signal('');
  /** Categoría elegida en los chips; null = todas. */
  categoryId = signal<string | null>(null);

  /** Un chip por categoría con productos en el punto de venta, con su cantidad. */
  categoryChips = computed(() => {
    const chips = new Map<string, CategoryChip>();
    for (const product of this.productsResource.value() ?? []) {
      if (!product.categoryId) continue;
      const chip = chips.get(product.categoryId);
      if (chip) chip.count++;
      else chips.set(product.categoryId, { id: product.categoryId, name: product.categoryName ?? '', count: 1 });
    }
    return [...chips.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  });
  totalProducts = computed(() => this.productsResource.value()?.length ?? 0);

  /** Si la categoría elegida ya no tiene productos (tras recargar), se muestran todas. */
  activeCategoryId = computed(() => {
    const id = this.categoryId();
    return this.categoryChips().some(chip => chip.id === id) ? id : null;
  });

  filteredProducts = computed(() => {
    const products = this.productsResource.value() ?? [];
    const term = this.searchTerm().trim().toLocaleLowerCase();
    const categoryId = this.activeCategoryId();

    return products.filter(product =>
      (product.name.toLocaleLowerCase().includes(term) || product.barcode === term) &&
      (categoryId === null || product.categoryId === categoryId)
    )
  })
  scannerOpen = signal(false);
  /** Cámara en modo continuo: lo sumado desde que se abrió el lector y el último resultado. */
  cameraFeedback = signal<ScanFeedback>({ added: 0, message: '', tone: 'ok' });
  selectedProducts = signal<SaleCartItem[]>([]);

  openScanner() {
    this.cameraFeedback.set({ added: 0, message: '', tone: 'ok' });
    this.scannerOpen.set(true);
  }

  /** Cada código de la cámara: el resultado se ve dentro del lector, que sigue abierto. */
  addCameraScan(code: string) {
    const result = this.addBarcodeToCart(code);
    this.cameraFeedback.update(feedback => ({
      added: feedback.added + (result.ok ? 1 : 0),
      message: result.message,
      tone: result.ok ? 'ok' : 'error',
    }));
  }

  addProduct(product: ProductOption) {
    const existingItem = this.selectedProducts().find(item => item.productId === product.id);
    const currentQuantity = existingItem?.quantity ?? 0;

    if (currentQuantity >= (existingItem?.stock ?? product.stock)) return;

    if (!existingItem) {
      const newItem: SaleCartItem = {
        name: product.name,
        productId: product.id,
        salePrice: Number(product.salePrice),
        stock: product.stock,
        quantity: 1
      }
      this.selectedProducts.update(prev => [...prev, newItem])
      return
    }

    this.selectedProducts.update(prev =>
      prev.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  /**
   * Enter en el buscador: si es un código de barras (lo tipea una pistola lectora), agrega ese
   * producto y limpia el campo para el siguiente; si no, agrega el primer resultado.
   */
  addFirstMatch(input: HTMLInputElement) {
    const term = input.value.trim();
    if (/^\d{8,14}$/.test(term)) {
      this.addByBarcode(term);
      input.value = '';
      this.searchTerm.set('');
      return;
    }
    const product = this.filteredProducts()[0];
    if (product) this.addProduct(product);
  }

  /** Código leído con la pistola o escrito: avisa con una notificación. */
  addByBarcode(code: string) {
    const result = this.addBarcodeToCart(code);
    this.notificationService.show(result.message, result.ok ? undefined : 'error');
  }

  /** Busca el código entre todos los productos, sin el filtro de categoría, y suma una unidad. */
  private addBarcodeToCart(code: string): { ok: boolean; message: string } {
    const product = (this.productsResource.value() ?? []).find(option => option.barcode === code);
    if (!product) return { ok: false, message: `No tienes un producto con el código ${code}` };
    const inCart = this.selectedProducts().find(item => item.productId === product.id)?.quantity ?? 0;
    if (inCart >= product.stock) return { ok: false, message: `No queda stock de ${product.name}` };
    this.addProduct(product);
    return { ok: true, message: `${product.name} agregado` };
  }

  changeQuantity({ productId, quantity }: Pick<SaleCartItem, 'productId' | 'quantity'>) {
    if (!Number.isInteger(quantity) || quantity < 1) return;

    const item = this.selectedProducts().find(item => item.productId === productId);
    if (!item || quantity > item.stock) return;

    this.selectedProducts.update(items =>
      items.map(item => item.productId === productId ? { ...item, quantity } : item)
    );
  }

  removeProduct(productId: string) {
    this.selectedProducts.update(
      prev => prev.filter(item => item.productId !== productId)
    )
  }

  registerSale(paymentMethod: PaymentMethod) {
    if (this.savingSale()) return;
    // value() lanza si el recurso quedó en error: se trata como "sin caja" y se vuelve a consultar.
    const resource = this.cashRegisterService.currentCashRegisterResource;
    const register = resource.hasValue() ? resource.value() : null;
    if (!register || register.status !== 'OPEN') {
      this.notificationService.show('No hay una caja abierta. Ábrela para vender.', 'error');
      this.cashRegisterService.currentCashRegisterResource.reload();
      return;
    }
    const sale: CreateSaleRequest = {
      paymentMethod,
      cashRegisterId: register.id,
      items: SaleMapper.toCreateSaleItems(this.selectedProducts()),
      notes: '',
    }

    this.savingSale.set(true);
    this.inventoryMovementService.registerSale(sale).subscribe({
      next: () => {
        this.savingSale.set(false);
        this.selectedProducts.set([])
        this.productsResource.reload()
        this.saleOpen.set(false);
        this.notificationService.show('Venta registrada')
        this.cashRegisterService.currentCashRegisterResource.reload();
      },
      error: error => {
        this.savingSale.set(false);
        this.notificationService.show(extractApiError(error).message, 'error')
        this.cashRegisterService.currentCashRegisterResource.reload();
      }
    })
  }
}

interface CategoryChip {
  id: string;
  name: string;
  count: number;
}
