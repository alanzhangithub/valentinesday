/**
 * Race Condition Edge Cases Tests
 *
 * Tests concurrent operations including:
 * - Concurrent coin balance updates
 * - Double-redeem attempts
 * - Simultaneous coupon/wish operations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Types
type UserId = 'meedo' | 'beedo';

interface UserBalance {
  user: UserId;
  coins: number;
  version: number; // Optimistic locking version
}

interface Coupon {
  id: string;
  title: string;
  redeemed: boolean;
  redeemedAt?: string;
  redeemedBy?: UserId;
  version: number;
}

interface ShopPurchase {
  id: string;
  itemId: string;
  userId: UserId;
  cost: number;
  timestamp: string;
}

// Mock data stores with version tracking for optimistic locking
let userBalances: Map<UserId, UserBalance>;
let coupons: Map<string, Coupon>;
let purchases: ShopPurchase[];
let operationLog: string[];

// Simulated database lock
let locks: Map<string, boolean>;

// Helper to simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Acquire lock (simulate database row lock)
const acquireLock = async (resourceId: string): Promise<boolean> => {
  if (locks.get(resourceId)) {
    return false; // Already locked
  }
  locks.set(resourceId, true);
  return true;
};

const releaseLock = (resourceId: string): void => {
  locks.delete(resourceId);
};

// Atomic coin operations with optimistic locking
const addCoinsAtomic = async (
  userId: UserId,
  amount: number,
  expectedVersion: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  const current = userBalances.get(userId);

  if (!current) {
    return { success: false, error: 'User not found' };
  }

  // Check version for optimistic locking
  if (current.version !== expectedVersion) {
    return { success: false, error: 'Version conflict - balance was modified' };
  }

  // Simulate database write delay
  await delay(10);

  const updated: UserBalance = {
    ...current,
    coins: current.coins + amount,
    version: current.version + 1,
  };
  userBalances.set(userId, updated);
  operationLog.push(`Added ${amount} coins to ${userId}, new balance: ${updated.coins}`);

  return { success: true, newBalance: updated.coins };
};

const subtractCoinsAtomic = async (
  userId: UserId,
  amount: number,
  expectedVersion: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  const current = userBalances.get(userId);

  if (!current) {
    return { success: false, error: 'User not found' };
  }

  if (current.version !== expectedVersion) {
    return { success: false, error: 'Version conflict - balance was modified' };
  }

  if (current.coins < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  await delay(10);

  const updated: UserBalance = {
    ...current,
    coins: current.coins - amount,
    version: current.version + 1,
  };
  userBalances.set(userId, updated);
  operationLog.push(`Subtracted ${amount} coins from ${userId}, new balance: ${updated.coins}`);

  return { success: true, newBalance: updated.coins };
};

// Thread-safe coin update with retry
const updateCoinsWithRetry = async (
  userId: UserId,
  amount: number,
  maxRetries: number = 3
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const current = userBalances.get(userId);
    if (!current) {
      return { success: false, error: 'User not found' };
    }

    const result = amount >= 0
      ? await addCoinsAtomic(userId, amount, current.version)
      : await subtractCoinsAtomic(userId, Math.abs(amount), current.version);

    if (result.success) {
      return result;
    }

    if (result.error !== 'Version conflict - balance was modified') {
      return result; // Non-retryable error
    }

    // Wait before retry with exponential backoff
    await delay(Math.pow(2, attempt) * 10);
  }

  return { success: false, error: 'Max retries exceeded' };
};

// Atomic coupon redemption with locking
const redeemCouponAtomic = async (
  couponId: string,
  userId: UserId
): Promise<{ success: boolean; error?: string }> => {
  const lockId = `coupon:${couponId}`;

  // Try to acquire lock
  const gotLock = await acquireLock(lockId);
  if (!gotLock) {
    return { success: false, error: 'Coupon is being processed by another request' };
  }

  try {
    const coupon = coupons.get(couponId);

    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }

    if (coupon.redeemed) {
      return { success: false, error: 'Coupon already redeemed' };
    }

    // Simulate database write delay
    await delay(20);

    coupon.redeemed = true;
    coupon.redeemedAt = new Date().toISOString();
    coupon.redeemedBy = userId;
    coupon.version += 1;

    operationLog.push(`Coupon ${couponId} redeemed by ${userId}`);

    return { success: true };
  } finally {
    releaseLock(lockId);
  }
};

// Purchase with atomic balance deduction
const purchaseItemAtomic = async (
  userId: UserId,
  itemId: string,
  cost: number
): Promise<{ success: boolean; purchase?: ShopPurchase; error?: string }> => {
  const lockId = `purchase:${userId}`;

  const gotLock = await acquireLock(lockId);
  if (!gotLock) {
    return { success: false, error: 'Another purchase is in progress' };
  }

  try {
    const balance = userBalances.get(userId);
    if (!balance) {
      return { success: false, error: 'User not found' };
    }

    if (balance.coins < cost) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Deduct coins atomically
    const deductResult = await subtractCoinsAtomic(userId, cost, balance.version);
    if (!deductResult.success) {
      return { success: false, error: deductResult.error };
    }

    const purchase: ShopPurchase = {
      id: `purchase_${Date.now()}`,
      itemId,
      userId,
      cost,
      timestamp: new Date().toISOString(),
    };
    purchases.push(purchase);

    operationLog.push(`${userId} purchased ${itemId} for ${cost} coins`);

    return { success: true, purchase };
  } finally {
    releaseLock(lockId);
  }
};

describe('Race Condition Edge Cases', () => {
  beforeEach(() => {
    userBalances = new Map();
    coupons = new Map();
    purchases = [];
    operationLog = [];
    locks = new Map();

    // Initialize users
    userBalances.set('meedo', { user: 'meedo', coins: 100, version: 0 });
    userBalances.set('beedo', { user: 'beedo', coins: 100, version: 0 });
  });

  describe('Concurrent Coin Balance Updates', () => {
    it('should handle concurrent coin additions without losing updates', async () => {
      const userId: UserId = 'meedo';
      const initialBalance = userBalances.get(userId)!.coins;

      // Simulate 5 concurrent coin additions of 10 each
      const additions = Array(5).fill(null).map(() =>
        updateCoinsWithRetry(userId, 10)
      );

      const results = await Promise.all(additions);

      // All should eventually succeed (with retries)
      const successCount = results.filter(r => r.success).length;
      const finalBalance = userBalances.get(userId)!.coins;

      // At minimum, some should succeed
      expect(successCount).toBeGreaterThan(0);

      // The final balance should reflect successful additions
      expect(finalBalance).toBe(initialBalance + (successCount * 10));
    });

    it('should detect version conflicts in optimistic locking', async () => {
      const userId: UserId = 'beedo';
      const balance = userBalances.get(userId)!;
      const originalVersion = balance.version;

      // First operation with correct version
      const result1 = await addCoinsAtomic(userId, 10, originalVersion);
      expect(result1.success).toBe(true);

      // Second operation with stale version should fail
      const result2 = await addCoinsAtomic(userId, 10, originalVersion);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Version conflict - balance was modified');
    });

    it('should prevent balance going negative in concurrent withdrawals', async () => {
      const userId: UserId = 'meedo';
      userBalances.set(userId, { user: userId, coins: 50, version: 0 });

      // Try to withdraw 30 twice concurrently (should only succeed once)
      const balance = userBalances.get(userId)!;

      const [result1, result2] = await Promise.all([
        subtractCoinsAtomic(userId, 30, balance.version),
        subtractCoinsAtomic(userId, 30, balance.version),
      ]);

      // One should succeed, one should fail due to version conflict
      const successCount = [result1, result2].filter(r => r.success).length;
      expect(successCount).toBe(1);

      // Balance should never go negative
      expect(userBalances.get(userId)!.coins).toBeGreaterThanOrEqual(0);
    });

    it('should handle rapid sequential updates correctly', async () => {
      const userId: UserId = 'beedo';

      for (let i = 0; i < 10; i++) {
        await updateCoinsWithRetry(userId, 5);
      }

      // All 10 updates should be reflected
      expect(userBalances.get(userId)!.coins).toBe(150); // 100 + 10*5
    });
  });

  describe('Double-Redeem Prevention', () => {
    let couponId: string;

    beforeEach(() => {
      couponId = 'coupon_test_123';
      coupons.set(couponId, {
        id: couponId,
        title: 'Test Coupon',
        redeemed: false,
        version: 0,
      });
    });

    it('should prevent double redemption of same coupon', async () => {
      // Two users try to redeem at the same time
      const [result1, result2] = await Promise.all([
        redeemCouponAtomic(couponId, 'meedo'),
        redeemCouponAtomic(couponId, 'beedo'),
      ]);

      // Exactly one should succeed
      const successCount = [result1, result2].filter(r => r.success).length;
      expect(successCount).toBe(1);

      // Coupon should be redeemed
      const coupon = coupons.get(couponId)!;
      expect(coupon.redeemed).toBe(true);
    });

    it('should reject redemption if coupon already redeemed', async () => {
      // First redemption
      await redeemCouponAtomic(couponId, 'meedo');

      // Second attempt should fail
      const result = await redeemCouponAtomic(couponId, 'beedo');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Coupon already redeemed');
    });

    it('should maintain redemption info after double-redeem attempt', async () => {
      // First redemption succeeds
      await redeemCouponAtomic(couponId, 'meedo');

      // Second attempt fails but shouldn't corrupt data
      await redeemCouponAtomic(couponId, 'beedo');

      const coupon = coupons.get(couponId)!;
      expect(coupon.redeemedBy).toBe('meedo');
      expect(coupon.redeemedAt).toBeDefined();
    });

    it('should handle rapid repeated redemption attempts', async () => {
      // 10 rapid redemption attempts
      const attempts = Array(10).fill(null).map((_, i) =>
        redeemCouponAtomic(couponId, i % 2 === 0 ? 'meedo' : 'beedo')
      );

      const results = await Promise.all(attempts);

      // Exactly one should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(1);
    });
  });

  describe('Concurrent Purchase Operations', () => {
    beforeEach(() => {
      userBalances.set('meedo', { user: 'meedo', coins: 100, version: 0 });
    });

    it('should prevent overspending with concurrent purchases', async () => {
      const userId: UserId = 'meedo';

      // Try to make 3 purchases of 50 coins each with only 100 coins
      const [p1, p2, p3] = await Promise.all([
        purchaseItemAtomic(userId, 'item1', 50),
        purchaseItemAtomic(userId, 'item2', 50),
        purchaseItemAtomic(userId, 'item3', 50),
      ]);

      const successCount = [p1, p2, p3].filter(r => r.success).length;

      // Should only allow 2 purchases maximum (100 / 50 = 2)
      expect(successCount).toBeLessThanOrEqual(2);

      // Balance should never go negative
      expect(userBalances.get(userId)!.coins).toBeGreaterThanOrEqual(0);
    });

    it('should maintain purchase records for successful transactions only', async () => {
      const userId: UserId = 'meedo';
      userBalances.set(userId, { user: userId, coins: 30, version: 0 });

      // Try to buy expensive item
      const result = await purchaseItemAtomic(userId, 'expensive', 50);

      expect(result.success).toBe(false);
      expect(purchases).toHaveLength(0);
    });

    it('should process sequential purchases correctly', async () => {
      const userId: UserId = 'beedo';
      userBalances.set(userId, { user: userId, coins: 100, version: 0 });

      // Sequential purchases
      await purchaseItemAtomic(userId, 'item1', 30);
      await purchaseItemAtomic(userId, 'item2', 30);
      const result3 = await purchaseItemAtomic(userId, 'item3', 30);

      expect(purchases).toHaveLength(3);
      expect(result3.success).toBe(true);
      expect(userBalances.get(userId)!.coins).toBe(10);
    });
  });

  describe('Mixed Concurrent Operations', () => {
    it('should handle concurrent earn and spend operations', async () => {
      const userId: UserId = 'meedo';
      userBalances.set(userId, { user: userId, coins: 50, version: 0 });

      // Concurrent: earn 30, spend 40
      const results = await Promise.all([
        updateCoinsWithRetry(userId, 30),
        updateCoinsWithRetry(userId, -40),
      ]);

      // Both might succeed or one might fail
      // Final balance should be consistent
      const balance = userBalances.get(userId)!.coins;
      expect(balance).toBeGreaterThanOrEqual(0);

      // If both succeeded, balance = 50 + 30 - 40 = 40
      // If only earn succeeded, balance = 80
      // If only spend succeeded, balance = 10
      expect([10, 40, 80]).toContain(balance);
    });

    it('should maintain operation log consistency', async () => {
      const userId: UserId = 'beedo';
      operationLog = [];

      await updateCoinsWithRetry(userId, 10);
      await updateCoinsWithRetry(userId, 20);
      await updateCoinsWithRetry(userId, -15);

      expect(operationLog.length).toBeGreaterThanOrEqual(3);
      // Log should contain info about coin changes
      expect(operationLog.some(log => log.includes('beedo'))).toBe(true);
    });
  });

  describe('Lock Contention', () => {
    it('should handle lock timeout gracefully', async () => {
      const lockId = 'test-lock';

      // Acquire lock
      const firstLock = await acquireLock(lockId);
      expect(firstLock).toBe(true);

      // Second attempt should fail immediately
      const secondLock = await acquireLock(lockId);
      expect(secondLock).toBe(false);

      // Release and try again
      releaseLock(lockId);
      const thirdLock = await acquireLock(lockId);
      expect(thirdLock).toBe(true);
    });

    it('should release locks even after errors', async () => {
      const couponId = 'nonexistent';

      // This will fail but should still release lock
      const result = await redeemCouponAtomic(couponId, 'meedo');
      expect(result.success).toBe(false);

      // Lock should be released
      const lockId = `coupon:${couponId}`;
      expect(locks.has(lockId)).toBe(false);
    });
  });
});
