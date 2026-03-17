// Meedobeedo v2.0 Database Types
// Auto-generated types for Supabase tables

// ============================================
// ENUMS
// ============================================

export type UserRole = 'meedo' | 'beedo';
export type EventType = 'hangout' | 'mto' | 'bto' | 'date' | 'special';
export type WishStatus = 'pending' | 'granted' | 'denied';
export type ShopItemType = 'coupon' | 'reward';
export type ShopItemTier = 'small' | 'medium' | 'large';
export type PriceRange = '$' | '$$' | '$$$';
export type HeadlineType = 'static' | 'dynamic';

// ============================================
// TABLE TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  google_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface Photo {
  id: string;
  url: string;
  storage_path: string | null;
  uploaded_by: UserRole;
  uploaded_at: string;
  caption: string | null;
}

// Canvas data structure for sticker boards
export interface StickerData {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface CanvasData {
  stickers: StickerData[];
}

export interface Board {
  id: string;
  name: string;
  created_by: UserRole;
  created_at: string;
  updated_at: string;
  canvas_data: CanvasData;
}

export interface Event {
  id: string;
  google_event_id: string | null;
  title: string;
  type: EventType;
  start_time: string;
  end_time: string;
  location: string | null;
  description: string | null;
  created_by: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Stamp {
  id: string;
  name: string;
  emoji: string;
  color: string;
  created_by: UserRole;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

export interface DayStamp {
  id: string;
  stamp_id: string;
  date: string;
  placed_by: UserRole;
  placed_at: string;
}

export interface Wish {
  id: string;
  text: string;
  wished_by: UserRole;
  wished_at: string;
  status: WishStatus;
  status_note: string | null;
  resolved_at: string | null;
}

export interface Coupon {
  id: string;
  title: string;
  description: string | null;
  created_by: UserRole;
  created_at: string;
  expires_at: string | null;
  redeemed: boolean;
  redeemed_at: string | null;
  redeemed_by: UserRole | null;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  type: ShopItemType;
  price: number;
  tier: ShopItemTier | null;
  active: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  item_id: string | null;
  purchased_by: UserRole;
  purchased_at: string;
  price_paid: number;
  fulfilled: boolean;
  fulfilled_at: string | null;
}

export interface UserBalance {
  user_role: UserRole;
  coins: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface UserBadge {
  id: string;
  user_role: UserRole;
  badge_id: string;
  earned_at: string;
}

export interface NewsHeadline {
  id: string;
  text: string;
  type: HeadlineType;
  active: boolean;
  created_at: string;
}

export interface Countdown {
  id: string;
  title: string;
  target_date: string;
  active: boolean;
  created_at: string;
}

export interface FoodOption {
  id: string;
  name: string;
  cuisine: string | null;
  price_range: PriceRange | null;
  location: string | null;
  added_by: UserRole;
  weight: number;
  active: boolean;
  created_at: string;
}

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export type UserInsert = Omit<User, 'id' | 'created_at' | 'last_login_at'> & {
  id?: string;
  created_at?: string;
  last_login_at?: string | null;
};

export type PhotoInsert = Omit<Photo, 'id' | 'uploaded_at'> & {
  id?: string;
  uploaded_at?: string;
};

export type BoardInsert = Omit<Board, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type WishInsert = Omit<Wish, 'id' | 'wished_at' | 'status' | 'status_note' | 'resolved_at'> & {
  id?: string;
  wished_at?: string;
  status?: WishStatus;
  status_note?: string | null;
  resolved_at?: string | null;
};

export type CouponInsert = Omit<Coupon, 'id' | 'created_at' | 'redeemed' | 'redeemed_at' | 'redeemed_by'> & {
  id?: string;
  created_at?: string;
  redeemed?: boolean;
  redeemed_at?: string | null;
  redeemed_by?: UserRole | null;
};

export type ShopItemInsert = Omit<ShopItem, 'id' | 'created_at' | 'active'> & {
  id?: string;
  created_at?: string;
  active?: boolean;
};

export type PurchaseInsert = Omit<Purchase, 'id' | 'purchased_at' | 'fulfilled' | 'fulfilled_at'> & {
  id?: string;
  purchased_at?: string;
  fulfilled?: boolean;
  fulfilled_at?: string | null;
};

export type BadgeInsert = Badge;

export type UserBadgeInsert = Omit<UserBadge, 'id' | 'earned_at'> & {
  id?: string;
  earned_at?: string;
};

export type NewsHeadlineInsert = Omit<NewsHeadline, 'id' | 'created_at' | 'active'> & {
  id?: string;
  created_at?: string;
  active?: boolean;
};

export type CountdownInsert = Omit<Countdown, 'id' | 'created_at' | 'active'> & {
  id?: string;
  created_at?: string;
  active?: boolean;
};

export type FoodOptionInsert = Omit<FoodOption, 'id' | 'created_at' | 'weight' | 'active'> & {
  id?: string;
  created_at?: string;
  weight?: number;
  active?: boolean;
};

export type StampInsert = Omit<Stamp, 'id' | 'created_at' | 'updated_at' | 'is_default'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
};

export type DayStampInsert = Omit<DayStamp, 'id' | 'placed_at'> & {
  id?: string;
  placed_at?: string;
};

// ============================================
// UPDATE TYPES (for updating existing records)
// ============================================

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
export type PhotoUpdate = Partial<Omit<Photo, 'id' | 'uploaded_at'>>;
export type BoardUpdate = Partial<Omit<Board, 'id' | 'created_at'>>;
export type EventUpdate = Partial<Omit<Event, 'id' | 'created_at'>>;
export type WishUpdate = Partial<Omit<Wish, 'id' | 'wished_at'>>;
export type CouponUpdate = Partial<Omit<Coupon, 'id' | 'created_at'>>;
export type ShopItemUpdate = Partial<Omit<ShopItem, 'id' | 'created_at'>>;
export type PurchaseUpdate = Partial<Omit<Purchase, 'id' | 'purchased_at'>>;
export type NewsHeadlineUpdate = Partial<Omit<NewsHeadline, 'id' | 'created_at'>>;
export type CountdownUpdate = Partial<Omit<Countdown, 'id' | 'created_at'>>;
export type FoodOptionUpdate = Partial<Omit<FoodOption, 'id' | 'created_at'>>;
export type StampUpdate = Partial<Omit<Stamp, 'id' | 'created_at'>>;
export type DayStampUpdate = Partial<DayStamp>; // placements are immutable — delete and re-create (enforced at app level)

// For day_stamps with joined stamp data (from select('*, stamp:stamps(*)'))
export interface DayStampWithStamp extends DayStamp {
  stamp: Stamp;
}

// ============================================
// SUPABASE DATABASE TYPE (for createClient<Database>)
// ============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      photos: {
        Row: Photo;
        Insert: PhotoInsert;
        Update: PhotoUpdate;
        Relationships: [];
      };
      boards: {
        Row: Board;
        Insert: BoardInsert;
        Update: BoardUpdate;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: EventInsert;
        Update: EventUpdate;
        Relationships: [];
      };
      wishes: {
        Row: Wish;
        Insert: WishInsert;
        Update: WishUpdate;
        Relationships: [];
      };
      coupons: {
        Row: Coupon;
        Insert: CouponInsert;
        Update: CouponUpdate;
        Relationships: [];
      };
      shop_items: {
        Row: ShopItem;
        Insert: ShopItemInsert;
        Update: ShopItemUpdate;
        Relationships: [];
      };
      purchases: {
        Row: Purchase;
        Insert: PurchaseInsert;
        Update: PurchaseUpdate;
        Relationships: [];
      };
      user_balances: {
        Row: UserBalance;
        Insert: never;
        Update: Partial<Omit<UserBalance, 'user_role'>>;
        Relationships: [];
      };
      badges: {
        Row: Badge;
        Insert: BadgeInsert;
        Update: Partial<Badge>;
        Relationships: [];
      };
      user_badges: {
        Row: UserBadge;
        Insert: UserBadgeInsert;
        Update: Partial<UserBadge>;
        Relationships: [];
      };
      news_headlines: {
        Row: NewsHeadline;
        Insert: NewsHeadlineInsert;
        Update: NewsHeadlineUpdate;
        Relationships: [];
      };
      countdowns: {
        Row: Countdown;
        Insert: CountdownInsert;
        Update: CountdownUpdate;
        Relationships: [];
      };
      food_options: {
        Row: FoodOption;
        Insert: FoodOptionInsert;
        Update: FoodOptionUpdate;
        Relationships: [];
      };
      stamps: {
        Row: Stamp;
        Insert: StampInsert;
        Update: StampUpdate;
        Relationships: [];
      };
      day_stamps: {
        Row: DayStamp;
        Insert: DayStampInsert;
        Update: DayStampUpdate;
        Relationships: [];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    Functions: {
      update_coin_balance: {
        Args: {
          p_user_role: UserRole;
          p_amount: number;
          p_is_earning: boolean;
        };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      event_type: EventType;
      wish_status: WishStatus;
      shop_item_type: ShopItemType;
      shop_item_tier: ShopItemTier;
      price_range: PriceRange;
      headline_type: HeadlineType;
    };
  };
}

// ============================================
// HELPER TYPES
// ============================================

// For purchases with item details joined
export interface PurchaseWithItem extends Purchase {
  shop_item: ShopItem | null;
}

// For user badges with badge details joined
export interface UserBadgeWithDetails extends UserBadge {
  badge: Badge;
}

// For events with formatted dates (useful for display)
export interface EventDisplay extends Event {
  formattedStart: string;
  formattedEnd: string;
  isAllDay: boolean;
}

// Generic response type for API routes
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
