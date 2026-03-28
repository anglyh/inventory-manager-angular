export interface CreatePurchaseItemDto {
  productId: string;
  unitCost: number;
  quantity: number;
}

export interface CreatePurchaseDto {
  supplierName: string;
  notes: string | null | undefined;
  purchaseDate: string
  items: CreatePurchaseItemDto[];
}