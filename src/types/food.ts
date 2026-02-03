export type PriceRange = '$' | '$$' | '$$$';

export interface FoodOption {
  id: string;
  name: string;
  cuisine?: string;
  priceRange?: PriceRange;
  location?: string;
  addedBy: 'meedo' | 'beedo';
  weight: number; // 1-5, higher = more likely to be picked
  createdAt: string;
}

export interface RecentPick {
  id: string;
  foodOptionId: string;
  foodOptionName: string;
  pickedAt: string;
  wasRerolled: boolean;
}
