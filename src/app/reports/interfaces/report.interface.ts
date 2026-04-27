export type ReportPeriod = 'today' | 'week' | 'month';

export interface ProfitSummaryResponse {
  from: string;
  to: string;
  revenue: string;
  cogs: string;
  profit: string;
  marginPct: string;
  salesCount: number;
  avgTicket: string;
}

export interface ProfitByProductItem {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: string;
  cogs: string;
  profit: string;
  marginPct: string;
}

export interface ProfitByProductResponse {
  from: string;
  to: string;
  products: ProfitByProductItem[];
}
