import type { CreateSaleItem, SaleCartItem } from '../interfaces/sale.interface';

export class SaleMapper {
  static toCreateSaleItems(products: SaleCartItem[]): CreateSaleItem[] {
    return products.map(product => ({
      productId: product.productId,
      quantity: product.quantity,
      salePrice: product.salePrice,
    }));
  }
}
