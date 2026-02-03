/**
 * Coin Economy Integration Tests
 *
 * Tests the complete coin economy flow:
 * - Earning coins from games
 * - Spending coins in shop
 * - Balance updates and validation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Types
type UserId = 'meedo' | 'beedo';

interface UserBalance {
  user: UserId;
  coins: number;
  lastUpdated: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'coupon' | 'reward';
  price: number;
  tier?: 'small' | 'medium' | 'large';
}

interface Purchase {
  id: string;
  itemId: string;
  purchasedBy: UserId;
  purchasedAt: string;
  fulfilled: boolean;
  fulfilledAt?: string;
}

interface GameResult {
  gameId: string;
  userId: UserId;
  score: number;
  coinsEarned: number;
  timestamp: string;
}

// Mock database state
let userBalances: Map<UserId, UserBalance>;
let purchases: Purchase[];

// Game reward tiers
const GAME_REWARDS = {
  'spelling-mee': { baseReward: 10, bonusPerCorrect: 2, maxBonus: 50 },
  'meedo-memory': { baseReward: 15, bonusPerPair: 3, maxBonus: 60 },
  'tap-the-beedo': { baseReward: 5, bonusPerTap: 1, maxBonus: 100 },
  'slot-machine': { costPerSpin: 5, minWin: 0, maxWin: 50 },
};

// Shop items
const SHOP_ITEMS: ShopItem[] = [
  { id: 'coupon-movie', name: 'Movie Night Pick', description: 'Choose the movie', type: 'coupon', price: 30 },
  { id: 'coupon-backrub', name: 'Backrub', description: '10 minute backrub', type: 'coupon', price: 50 },
  { id: 'reward-boba', name: 'Boba', description: 'Free boba drink', type: 'reward', price: 100, tier: 'small' },
  { id: 'reward-dinner', name: 'Dinner Choice', description: 'Pick where we eat', type: 'reward', price: 300, tier: 'medium' },
  { id: 'reward-fancy', name: 'Fancy Dinner', description: 'Nice restaurant', type: 'reward', price: 1000, tier: 'large' },
];

// Helper functions
const getBalance = (userId: UserId): number => {
  return userBalances.get(userId)?.coins ?? 0;
};

const addCoins = (userId: UserId, amount: number): UserBalance => {
  const current = userBalances.get(userId) || { user: userId, coins: 0, lastUpdated: '' };
  const updated: UserBalance = {
    ...current,
    coins: current.coins + amount,
    lastUpdated: new Date().toISOString(),
  };
  userBalances.set(userId, updated);
  return updated;
};

const subtractCoins = (userId: UserId, amount: number): UserBalance | null => {
  const current = userBalances.get(userId);
  if (!current || current.coins < amount) {
    return null; // Insufficient balance
  }
  const updated: UserBalance = {
    ...current,
    coins: current.coins - amount,
    lastUpdated: new Date().toISOString(),
  };
  userBalances.set(userId, updated);
  return updated;
};

const calculateGameReward = (gameId: string, score: number): number => {
  const config = GAME_REWARDS[gameId as keyof typeof GAME_REWARDS];
  if (!config) return 0;

  if (gameId === 'slot-machine') {
    // Slot machine is gambling - can win or lose
    return score; // Score represents win amount
  }

  const bonus = Math.min(score * (config as any).bonusPerCorrect || (config as any).bonusPerPair || (config as any).bonusPerTap, (config as any).maxBonus);
  return (config as any).baseReward + bonus;
};

const purchaseItem = (userId: UserId, itemId: string): Purchase | null => {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return null;

  const balance = getBalance(userId);
  if (balance < item.price) return null;

  const result = subtractCoins(userId, item.price);
  if (!result) return null;

  const purchase: Purchase = {
    id: `purchase_${Date.now()}`,
    itemId,
    purchasedBy: userId,
    purchasedAt: new Date().toISOString(),
    fulfilled: false,
  };
  purchases.push(purchase);
  return purchase;
};

describe('Coin Economy Integration', () => {
  beforeEach(() => {
    userBalances = new Map();
    purchases = [];
    // Initialize both users with 0 coins
    userBalances.set('meedo', { user: 'meedo', coins: 0, lastUpdated: new Date().toISOString() });
    userBalances.set('beedo', { user: 'beedo', coins: 0, lastUpdated: new Date().toISOString() });
  });

  describe('Earning Coins from Games', () => {
    it('should award coins for completing Spelling Mee', () => {
      const userId: UserId = 'meedo';
      const score = 10; // 10 correct words

      const reward = calculateGameReward('spelling-mee', score);
      addCoins(userId, reward);

      expect(reward).toBe(30); // 10 base + 10*2 bonus
      expect(getBalance(userId)).toBe(30);
    });

    it('should award coins for completing Meedo Memory', () => {
      const userId: UserId = 'beedo';
      const score = 8; // 8 pairs matched

      const reward = calculateGameReward('meedo-memory', score);
      addCoins(userId, reward);

      expect(reward).toBe(39); // 15 base + 8*3 bonus
      expect(getBalance(userId)).toBe(39);
    });

    it('should award coins for Tap the Beedo', () => {
      const userId: UserId = 'meedo';
      const score = 50; // 50 taps

      const reward = calculateGameReward('tap-the-beedo', score);
      addCoins(userId, reward);

      expect(reward).toBe(55); // 5 base + 50*1 bonus
      expect(getBalance(userId)).toBe(55);
    });

    it('should cap bonus at max limit', () => {
      const userId: UserId = 'beedo';
      const score = 200; // way more than expected

      const reward = calculateGameReward('tap-the-beedo', score);

      expect(reward).toBe(105); // 5 base + 100 max bonus
    });

    it('should accumulate coins across multiple games', () => {
      const userId: UserId = 'meedo';

      // Play Spelling Mee
      addCoins(userId, calculateGameReward('spelling-mee', 5)); // 10 + 10 = 20
      expect(getBalance(userId)).toBe(20);

      // Play Memory
      addCoins(userId, calculateGameReward('meedo-memory', 6)); // 15 + 18 = 33
      expect(getBalance(userId)).toBe(53);

      // Play Tap the Beedo
      addCoins(userId, calculateGameReward('tap-the-beedo', 30)); // 5 + 30 = 35
      expect(getBalance(userId)).toBe(88);
    });
  });

  describe('Spending Coins in Shop', () => {
    beforeEach(() => {
      // Give meedo some starting coins
      userBalances.set('meedo', { user: 'meedo', coins: 500, lastUpdated: new Date().toISOString() });
    });

    it('should successfully purchase item with sufficient balance', () => {
      const userId: UserId = 'meedo';
      const purchase = purchaseItem(userId, 'coupon-movie');

      expect(purchase).not.toBeNull();
      expect(purchase?.itemId).toBe('coupon-movie');
      expect(purchase?.purchasedBy).toBe(userId);
      expect(purchase?.fulfilled).toBe(false);
      expect(getBalance(userId)).toBe(470); // 500 - 30
    });

    it('should fail to purchase item with insufficient balance', () => {
      const userId: UserId = 'beedo';
      // beedo has 0 coins
      const purchase = purchaseItem(userId, 'reward-boba');

      expect(purchase).toBeNull();
      expect(getBalance(userId)).toBe(0); // unchanged
    });

    it('should fail to purchase non-existent item', () => {
      const userId: UserId = 'meedo';
      const purchase = purchaseItem(userId, 'fake-item');

      expect(purchase).toBeNull();
      expect(getBalance(userId)).toBe(500); // unchanged
    });

    it('should handle multiple purchases correctly', () => {
      const userId: UserId = 'meedo';

      // Purchase 1
      const p1 = purchaseItem(userId, 'coupon-movie'); // 30 coins
      expect(p1).not.toBeNull();
      expect(getBalance(userId)).toBe(470);

      // Purchase 2
      const p2 = purchaseItem(userId, 'coupon-backrub'); // 50 coins
      expect(p2).not.toBeNull();
      expect(getBalance(userId)).toBe(420);

      // Purchase 3 - expensive
      const p3 = purchaseItem(userId, 'reward-dinner'); // 300 coins
      expect(p3).not.toBeNull();
      expect(getBalance(userId)).toBe(120);

      expect(purchases).toHaveLength(3);
    });

    it('should reject purchase when it would make balance negative', () => {
      const userId: UserId = 'meedo';
      userBalances.set(userId, { user: userId, coins: 50, lastUpdated: new Date().toISOString() });

      // Try to buy 100 coin item with only 50 coins
      const purchase = purchaseItem(userId, 'reward-boba');

      expect(purchase).toBeNull();
      expect(getBalance(userId)).toBe(50); // unchanged
    });
  });

  describe('Balance Updates', () => {
    it('should track lastUpdated timestamp on balance changes', () => {
      const userId: UserId = 'meedo';
      const before = new Date().toISOString();

      addCoins(userId, 100);

      const balance = userBalances.get(userId);
      expect(balance?.lastUpdated).toBeDefined();
      expect(new Date(balance!.lastUpdated).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
    });

    it('should prevent negative balance', () => {
      const userId: UserId = 'meedo';
      userBalances.set(userId, { user: userId, coins: 10, lastUpdated: new Date().toISOString() });

      const result = subtractCoins(userId, 20);

      expect(result).toBeNull();
      expect(getBalance(userId)).toBe(10); // unchanged
    });

    it('should handle zero coin operations', () => {
      const userId: UserId = 'beedo';
      addCoins(userId, 0);

      expect(getBalance(userId)).toBe(0);
    });
  });

  describe('Complete Economy Flow', () => {
    it('should support earn -> spend -> earn cycle', () => {
      const userId: UserId = 'beedo';

      // Start with 0
      expect(getBalance(userId)).toBe(0);

      // Play games to earn 100 coins
      addCoins(userId, 50);
      addCoins(userId, 50);
      expect(getBalance(userId)).toBe(100);

      // Buy boba (100 coins)
      const purchase = purchaseItem(userId, 'reward-boba');
      expect(purchase).not.toBeNull();
      expect(getBalance(userId)).toBe(0);

      // Earn more
      addCoins(userId, 30);
      expect(getBalance(userId)).toBe(30);
    });

    it('should maintain separate balances for each user', () => {
      addCoins('meedo', 100);
      addCoins('beedo', 200);

      expect(getBalance('meedo')).toBe(100);
      expect(getBalance('beedo')).toBe(200);

      subtractCoins('meedo', 50);

      expect(getBalance('meedo')).toBe(50);
      expect(getBalance('beedo')).toBe(200); // unchanged
    });
  });
});
