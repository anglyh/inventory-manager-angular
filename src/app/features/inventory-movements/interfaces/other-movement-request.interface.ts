import { components } from 'src/app/api/generated/schema';

export type CreateLossRequest = components['schemas']['CreateLoss'];
export type LossReason = CreateLossRequest['reason'];

export type StockCountRequest = components['schemas']['StockCount'];

/** `unitPrice` es el costo unitario inicial del producto. */
export type CreateInitialLoadRequest = components['schemas']['CreateInitialLoad'];
