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
import { tablerAlertCircle, tablerCashRegister, tablerRefresh } from '@ng-icons/tabler-icons';

@Component({
  selector: 'app-sales-page',
  imports: [ProductPicker, SaleDetail, RouterLink, NgIcon],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerCashRegister, tablerRefresh })],
  templateUrl: './sales-page.html',
})
export class SalesPage {
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
      product.name.toLocaleLowerCase().includes(term) &&
      (categoryId === null || product.categoryId === categoryId)
    )
  })
  selectedProducts = signal<SaleCartItem[]>([]);

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

  /** Enter en el buscador: agrega el primer resultado, si lo hay. */
  addFirstMatch() {
    const product = this.filteredProducts()[0];
    if (product) this.addProduct(product);
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
