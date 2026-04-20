/**
 * Producto tal como lo devuelve el API (listado / detalle).
 * Montos decimales vienen como string en JSON (p. ej. "3.50").
 */
export interface Product {
  id: string;
  /** No siempre viene en el listado paginado. */
  userId?: string;
  name: string;
  barcode?: string | null;
  salePrice: string;
  unitCostAvg: string;
  minStock: number;
  categoryId: string | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Cuerpo de POST/PUT: el backend valida `salePrice` con Zod como número.
 */
export interface ProductUpsertBody {
  id?: string;
  name: string;
  salePrice: number;
  minStock: number;
  categoryId: string | null;
  barcode?: string | null;
}

export interface ProductWithStock extends Product {
  stock: number;
  categoryName: string | null;
}