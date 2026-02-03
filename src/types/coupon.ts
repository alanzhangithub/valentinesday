export type User = 'meedo' | 'beedo';

export interface Coupon {
  id: string;
  title: string;
  description: string;
  created_by: User;
  created_at: string;
  expires_at?: string;
  redeemed: boolean;
  redeemed_at?: string;
  redeemed_by?: User;
}

export interface CreateCouponRequest {
  title: string;
  description: string;
  created_by: User;
  expires_at?: string;
}

export interface RedeemCouponRequest {
  coupon_id: string;
  redeemed_by: User;
}
