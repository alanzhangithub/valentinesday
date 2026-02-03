// Shop & Economy Types

export type User = 'meedo' | 'beedo';

export type ItemType = 'coupon' | 'reward';

export type Tier = 'small' | 'medium' | 'large';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  price: number;
  tier?: Tier;
  image?: string;
  available: boolean;
}

export interface Purchase {
  id: string;
  item_id: string;
  item?: ShopItem;
  purchased_by: User;
  purchased_at: string;
  fulfilled: boolean;
  fulfilled_at?: string;
}

export interface UserBalance {
  user: User;
  coins: number;
}

// API Response types
export interface ShopResponse {
  items: ShopItem[];
}

export interface PurchaseRequest {
  item_id: string;
  user: User;
}

export interface PurchaseResponse {
  success: boolean;
  purchase?: Purchase;
  new_balance?: number;
  error?: string;
}

export interface CoinBalanceResponse {
  user: User;
  coins: number;
}

export interface UpdateCoinsRequest {
  user: User;
  amount: number;
  operation: 'add' | 'subtract' | 'set';
}
