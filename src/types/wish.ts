export type WishStatus = 'pending' | 'granted' | 'denied';

export interface Wish {
  id: string;
  text: string;
  wished_by: 'meedo' | 'beedo';
  wished_at: string;
  status: WishStatus;
  status_note?: string;
  granted_at?: string;
}

export interface CreateWishRequest {
  text: string;
  wished_by: 'meedo' | 'beedo';
}

export interface UpdateWishStatusRequest {
  id: string;
  status: 'granted' | 'denied';
  status_note?: string;
}
