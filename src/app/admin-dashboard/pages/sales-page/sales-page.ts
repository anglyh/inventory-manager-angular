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
  filteredProducts = computed(() => {
    const products = this.productsResource.value() ?? [];
    const term = this.searchTerm().trim().toLocaleLowerCase();

    return products.filter(product => product.name.toLowerCase().includes(term))
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
    const register = this.cashRegisterService.currentCashRegisterResource.value();
    if (!register || register.status !== 'OPEN' || this.savingSale()) {
      this.notificationService.show('Abre o actualiza la caja antes de registrar una venta', 'error');
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
        this.notificationService.show('Venta registrada exitosamente')
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
