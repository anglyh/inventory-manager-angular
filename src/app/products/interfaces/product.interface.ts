export interface Product {
  id: string;
  userId: string;
  name: string;
  barcode?: string | null;
  salePrice: string;
  unitCostAvg: string;
  minStock: number;
  categoryId: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface ProductWithStock extends Product {
  stock: number;
  categoryName: string | null;
}