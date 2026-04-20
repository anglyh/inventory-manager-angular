export interface InventoryMovement {
  id:         string;
  entityName: string;
  notes:      string;
  items:      MovementItem[];
  totalAmount: number;
  createdAt: string;
}

export interface MovementItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInventoryMovement {
  entityName: string | null | undefined;
  notes: string | null | undefined;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[]
}