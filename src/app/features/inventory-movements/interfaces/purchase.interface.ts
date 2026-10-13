import { components } from 'src/app/api/generated/schema';

export type CreatePurchaseRequest = components['schemas']['CreatePurchase'];
export type CreatePurchaseItem = CreatePurchaseRequest['items'][number];