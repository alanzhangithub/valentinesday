// Shop data - in real implementation this would come from Supabase
// For now, using in-memory storage that resets on server restart

import { ShopItem, Purchase, UserBalance, User } from '@/types/shop';

// Default shop items
export const defaultShopItems: ShopItem[] = [
  // Coupons (lower tier, fun perks)
  {
    id: 'coupon-movie-pick',
    name: 'Movie Night Pick',
    description: 'Winner gets to pick the movie, no vetoes allowed!',
    type: 'coupon',
    price: 30,
    available: true,
  },
  {
    id: 'coupon-backrub',
    name: '10 Min Backrub',
    description: 'A solid 10 minutes of premium back massage action',
    type: 'coupon',
    price: 50,
    available: true,
  },
  {
    id: 'coupon-breakfast',
    name: 'Breakfast in Bed',
    description: 'Wake up to a cozy breakfast delivered to your pillow fort',
    type: 'coupon',
    price: 75,
    available: true,
  },
  {
    id: 'coupon-no-chores',
    name: 'Chore Pass',
    description: 'Skip one chore duty. The other person has to do it instead.',
    type: 'coupon',
    price: 60,
    available: true,
  },
  {
    id: 'coupon-music-control',
    name: 'Aux Control',
    description: 'Full DJ rights for the entire day. No skips allowed.',
    type: 'coupon',
    price: 40,
    available: true,
  },

  // Small rewards (100-200 coins)
  {
    id: 'reward-boba',
    name: 'Boba Run',
    description: 'One boba of your choice, paid for by your partner',
    type: 'reward',
    price: 100,
    tier: 'small',
    available: true,
  },
  {
    id: 'reward-snack',
    name: 'Snack Attack',
    description: 'Any snack from the store, no questions asked',
    type: 'reward',
    price: 120,
    tier: 'small',
    available: true,
  },
  {
    id: 'reward-ice-cream',
    name: 'Ice Cream Date',
    description: 'Ice cream trip with all the toppings',
    type: 'reward',
    price: 150,
    tier: 'small',
    available: true,
  },
  {
    id: 'reward-dessert',
    name: 'Dessert Spot',
    description: 'Pick any dessert place, partner pays',
    type: 'reward',
    price: 180,
    tier: 'small',
    available: true,
  },

  // Medium rewards (300-500 coins)
  {
    id: 'reward-dinner-pick',
    name: 'Dinner Choice',
    description: 'Pick where we eat for dinner, any cuisine',
    type: 'reward',
    price: 300,
    tier: 'medium',
    available: true,
  },
  {
    id: 'reward-activity',
    name: 'Activity Day',
    description: 'Plan the whole day activity, partner follows along',
    type: 'reward',
    price: 400,
    tier: 'medium',
    available: true,
  },
  {
    id: 'reward-takeout',
    name: 'Fancy Takeout',
    description: 'Order from that one expensive place guilt-free',
    type: 'reward',
    price: 350,
    tier: 'medium',
    available: true,
  },
  {
    id: 'reward-spa-day',
    name: 'Home Spa Day',
    description: 'Full pampering session: face masks, massage, the works',
    type: 'reward',
    price: 450,
    tier: 'medium',
    available: true,
  },

  // Large rewards (1000+ coins)
  {
    id: 'reward-fancy-dinner',
    name: 'Fancy Dinner',
    description: 'That nice restaurant you\'ve been eyeing. Dress code applies.',
    type: 'reward',
    price: 1000,
    tier: 'large',
    available: true,
  },
  {
    id: 'reward-experience',
    name: 'Experience Day',
    description: 'Mini golf, arcade, escape room, whatever you want',
    type: 'reward',
    price: 1200,
    tier: 'large',
    available: true,
  },
  {
    id: 'reward-day-trip',
    name: 'Day Trip',
    description: 'A whole day trip somewhere new. Adventure awaits!',
    type: 'reward',
    price: 1500,
    tier: 'large',
    available: true,
  },
  {
    id: 'reward-wish',
    name: 'One Wish',
    description: 'Make a reasonable wish and it shall be granted. Choose wisely.',
    type: 'reward',
    price: 2000,
    tier: 'large',
    available: true,
  },
];

// In-memory storage (replace with Supabase in production)
const shopItems: ShopItem[] = [...defaultShopItems];
const purchases: Purchase[] = [];
const balances: UserBalance[] = [
  { user: 'meedo', coins: 500 },
  { user: 'beedo', coins: 500 },
];

// Shop item functions
export function getShopItems(): ShopItem[] {
  return shopItems.filter(item => item.available);
}

export function getShopItem(id: string): ShopItem | undefined {
  return shopItems.find(item => item.id === id);
}

// Balance functions
export function getBalance(user: User): number {
  const balance = balances.find(b => b.user === user);
  return balance?.coins ?? 0;
}

export function updateBalance(user: User, amount: number, operation: 'add' | 'subtract' | 'set'): number {
  const balanceIndex = balances.findIndex(b => b.user === user);

  if (balanceIndex === -1) {
    balances.push({ user, coins: operation === 'set' ? amount : (operation === 'add' ? amount : 0) });
    return balances[balances.length - 1].coins;
  }

  switch (operation) {
    case 'add':
      balances[balanceIndex].coins += amount;
      break;
    case 'subtract':
      balances[balanceIndex].coins = Math.max(0, balances[balanceIndex].coins - amount);
      break;
    case 'set':
      balances[balanceIndex].coins = Math.max(0, amount);
      break;
  }

  return balances[balanceIndex].coins;
}

// Purchase functions
export function getPurchases(user?: User): Purchase[] {
  const userPurchases = user ? purchases.filter(p => p.purchased_by === user) : purchases;
  return userPurchases.map(p => ({
    ...p,
    item: getShopItem(p.item_id),
  }));
}

export function createPurchase(itemId: string, user: User): { success: boolean; purchase?: Purchase; error?: string } {
  const item = getShopItem(itemId);

  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  if (!item.available) {
    return { success: false, error: 'Item is not available' };
  }

  const currentBalance = getBalance(user);
  if (currentBalance < item.price) {
    return { success: false, error: 'Not enough Meedo Coins' };
  }

  // Deduct coins atomically
  updateBalance(user, item.price, 'subtract');

  const purchase: Purchase = {
    id: `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    item_id: itemId,
    purchased_by: user,
    purchased_at: new Date().toISOString(),
    fulfilled: false,
  };

  purchases.push(purchase);

  return {
    success: true,
    purchase: { ...purchase, item }
  };
}

export function fulfillPurchase(purchaseId: string): { success: boolean; error?: string } {
  const purchaseIndex = purchases.findIndex(p => p.id === purchaseId);

  if (purchaseIndex === -1) {
    return { success: false, error: 'Purchase not found' };
  }

  purchases[purchaseIndex].fulfilled = true;
  purchases[purchaseIndex].fulfilled_at = new Date().toISOString();

  return { success: true };
}
