import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type {
  CreateRoomRequest,
  CreateRoomTypeRequest,
  Room,
  RoomType,
  StoreSettings,
  UpdateRoomRequest,
  UpdateRoomTypeRequest,
  UpdateStoreSettingsRequest,
} from '../interfaces/room.interface';

const roomTypeUrl = `${environment.apiUrl}/room-type`;
const roomUrl = `${environment.apiUrl}/room`;
const settingsUrl = `${environment.apiUrl}/store/settings`;

@Injectable({ providedIn: 'root' })
export class RoomService {
  private http = inject(HttpClient);

  getRoomTypes(): Observable<RoomType[]> {
    return this.http.get<RoomType[]>(roomTypeUrl);
  }

  createRoomType(body: CreateRoomTypeRequest): Observable<RoomType> {
    return this.http.post<RoomType>(roomTypeUrl, body);
  }

  updateRoomType(id: string, body: UpdateRoomTypeRequest): Observable<RoomType> {
    return this.http.patch<RoomType>(`${roomTypeUrl}/${id}`, body);
  }

  /** 409 si alguna habitación usa el tipo. */
  deleteRoomType(id: string): Observable<void> {
    return this.http.delete<void>(`${roomTypeUrl}/${id}`);
  }

  /** Tablero: incluye las inactivas, ordenadas por piso y número. */
  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(roomUrl);
  }

  createRoom(body: CreateRoomRequest): Observable<Room> {
    return this.http.post<Room>(roomUrl, body);
  }

  updateRoom(id: string, body: UpdateRoomRequest): Observable<Room> {
    return this.http.patch<Room>(`${roomUrl}/${id}`, body);
  }

  /** 409 si la habitación tiene estadías: en ese caso se desactiva. */
  deleteRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${roomUrl}/${id}`);
  }

  markClean(id: string): Observable<Room> {
    return this.http.post<Room>(`${roomUrl}/${id}/clean`, {});
  }

  getSettings(): Observable<StoreSettings> {
    return this.http.get<StoreSettings>(settingsUrl);
  }

  updateSettings(body: UpdateStoreSettingsRequest): Observable<StoreSettings> {
    return this.http.patch<StoreSettings>(settingsUrl, body);
  }
}
