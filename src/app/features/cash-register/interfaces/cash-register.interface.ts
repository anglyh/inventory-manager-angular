import type { components, paths } from 'src/app/api/generated/schema';

export type CashRegister = components['schemas']['CashRegister'];
export type CashRegisterStatus = CashRegister['status'];
export type CashRegisterSummary = NonNullable<CashRegister['summary']>;
export type CashRegisterPage = components['schemas']['CashRegisterPage'];
export type CashRegisterQuery = NonNullable<paths['/api/cash-register']['get']['parameters']['query']>;
export type PageMeta = CashRegisterPage['meta'];

export type OpenCashRegisterRequest = components['schemas']['OpenCashRegister'];
export type CashRegisterOpened = components['schemas']['CashRegisterOpened'];
export type CloseCashRegisterRequest = components['schemas']['CloseCashRegister'];

export type CashMovementPage = components['schemas']['CashMovementPage'];
export type CashRegisterMovement = CashMovementPage['data'][number];
export type CashMovementType = CashRegisterMovement['type'];
export type CreateCashMovementRequest = components['schemas']['CreateCashMovement'];
