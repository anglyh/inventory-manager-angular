import type { components, paths } from 'src/app/api/generated/schema';

type Schemas = components['schemas'];

export type CheckInRequest = Schemas['CheckIn'];
export type CheckInGuest = CheckInRequest['guests'][number];
export type CheckInMinor = NonNullable<CheckInRequest['minors']>[number];
export type PaymentMethod = CheckInRequest['paymentMethod'];

export type StayListItem = Schemas['StayListItem'];
export type StayGuest = StayListItem['guests'][number];
export type StayMinor = StayListItem['minors'][number];
export type StayPage = Schemas['StayPage'];
export type StayQuery = NonNullable<paths['/api/stay']['get']['parameters']['query']>;

export type StayDetail = Schemas['StayDetail'];
export type StayCharge = StayDetail['charges'][number];
export type StayPayment = StayDetail['payments'][number];
export type SuggestedExtra = NonNullable<StayDetail['suggestedExtra']>;

export type CreateStayChargeRequest = Schemas['CreateStayCharge'];
export type CreateStayPaymentRequest = Schemas['CreateStayPayment'];
export type CheckOutRequest = Schemas['CheckOut'];
export type VoidStayPaymentRequest = Schemas['VoidStayPayment'];
