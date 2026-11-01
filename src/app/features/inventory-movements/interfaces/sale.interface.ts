import type { components } from '@/api/generated/schema';

// Estado de la pantalla de venta (no es parte del contrato de la API).
export interface SaleCartItem {
  productId: string;
  name: string;
  salePrice: number;
  quantity: number;
  stock: number;
}

// Contrato de la API.
export type CreateSaleRequest = components['schemas']['CreateSale'];
export type CreateSaleItem = CreateSaleRequest['items'][number];
export type PaymentMethod = CreateSaleRequest['paymentMethod'];