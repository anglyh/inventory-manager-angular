import type { components } from 'src/app/api/generated/schema';

type Schemas = components['schemas'];

export type RoomType = Schemas['RoomType'];
export type CreateRoomTypeRequest = Schemas['CreateRoomType'];
export type UpdateRoomTypeRequest = Schemas['UpdateRoomType'];

export type Room = Schemas['Room'];
export type RoomStatus = Room['status'];
export type ActiveStaySummary = NonNullable<Room['activeStay']>;
export type CreateRoomRequest = Schemas['CreateRoom'];
export type UpdateRoomRequest = Schemas['UpdateRoom'];

export type StoreSettings = Schemas['StoreSettings'];
export type UpdateStoreSettingsRequest = Schemas['UpdateStoreSettings'];

export type RateKind = Schemas['RateKind'];
export type DocumentType = Schemas['DocumentType'];
export type GuardianRelation = Schemas['GuardianRelation'];
export type Guest = NonNullable<Schemas['NullableGuest']>;
export type Sex = Guest['sex'];
