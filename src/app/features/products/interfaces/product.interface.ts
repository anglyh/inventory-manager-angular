import { components } from 'src/app/api/generated/schema';

export interface Product {
  id:           string;
  name:         string;
  barcode:      string | null;
  salePrice:    string;
  unitCostAvg:  string;
  stock:        number;
  minStock:     number;
  isActive:     boolean;
  categoryId:   null;
  createdAt:    string;
  categoryName: null;
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

/**
 * Campos que devuelve GET /product/options (solo productos activos) para
 * seleccionar o vender productos.
 */
export type ProductOption = components['schemas']['ProductOption'];

export interface ProductWithStock extends Product {
  stock: number;
}




/**
 * GET /product/barcode-lookup/{code}: producto de la tienda con ese código o datos sugeridos
 * de una base abierta (Open Food Facts y afines).
 */
export type BarcodeLookup = components['schemas']['BarcodeLookup'];
export type BarcodeSuggestion = NonNullable<BarcodeLookup['suggestion']>;
