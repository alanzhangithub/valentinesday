/**
 * Coupon Lifecycle Integration Tests
 *
 * Tests the complete coupon flow:
 * - Creating coupons
 * - Redeeming coupons
 * - Email notifications
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Types
type UserId = 'meedo' | 'beedo';

interface Coupon {
  id: string;
  title: string;
  description: string;
  createdBy: UserId;
  createdAt: string;
  expiresAt?: string;
  redeemed: boolean;
  redeemedAt?: string;
  redeemedBy?: UserId;
}

interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  type: 'coupon_created' | 'coupon_redeemed' | 'coupon_expiring';
}

// Mock data stores
let coupons: Coupon[];
let emailsSent: EmailNotification[];

// Mock email addresses
const USER_EMAILS: Record<UserId, string> = {
  meedo: 'meedo@example.com',
  beedo: 'beedo@example.com',
};

// Helper functions
const createCoupon = (
  title: string,
  description: string,
  createdBy: UserId,
  expiresAt?: string
): Coupon => {
  const coupon: Coupon = {
    id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    createdBy,
    createdAt: new Date().toISOString(),
    expiresAt,
    redeemed: false,
  };
  coupons.push(coupon);

  // Send notification to the other user
  const recipient = createdBy === 'meedo' ? 'beedo' : 'meedo';
  sendEmail({
    to: USER_EMAILS[recipient],
    subject: `New coupon from ${createdBy}!`,
    body: `You received a new coupon: "${title}" - ${description}`,
    type: 'coupon_created',
  });

  return coupon;
};

const redeemCoupon = (couponId: string, redeemedBy: UserId): Coupon | null => {
  const coupon = coupons.find(c => c.id === couponId);
  if (!coupon) return null;

  // Check if already redeemed
  if (coupon.redeemed) return null;

  // Check if expired
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return null;
  }

  // Redeem the coupon
  coupon.redeemed = true;
  coupon.redeemedAt = new Date().toISOString();
  coupon.redeemedBy = redeemedBy;

  // Send notification to the creator
  sendEmail({
    to: USER_EMAILS[coupon.createdBy],
    subject: `Your coupon was redeemed!`,
    body: `${redeemedBy} redeemed your coupon: "${coupon.title}"`,
    type: 'coupon_redeemed',
  });

  return coupon;
};

const sendEmail = (params: Omit<EmailNotification, 'id' | 'sentAt'>): EmailNotification => {
  const email: EmailNotification = {
    id: `email_${Date.now()}`,
    ...params,
    sentAt: new Date().toISOString(),
  };
  emailsSent.push(email);
  return email;
};

const getCouponsByUser = (userId: UserId): Coupon[] => {
  return coupons.filter(c => c.createdBy === userId);
};

const getAvailableCoupons = (forUser: UserId): Coupon[] => {
  return coupons.filter(c =>
    c.createdBy !== forUser && // Created by the other user
    !c.redeemed && // Not redeemed
    (!c.expiresAt || new Date(c.expiresAt) > new Date()) // Not expired
  );
};

const getRedeemedCoupons = (): Coupon[] => {
  return coupons.filter(c => c.redeemed);
};

describe('Coupon Lifecycle Integration', () => {
  beforeEach(() => {
    coupons = [];
    emailsSent = [];
  });

  describe('Creating Coupons', () => {
    it('should create a coupon with all required fields', () => {
      const coupon = createCoupon(
        'Movie Night',
        'Meedo picks the movie',
        'meedo'
      );

      expect(coupon.id).toBeDefined();
      expect(coupon.title).toBe('Movie Night');
      expect(coupon.description).toBe('Meedo picks the movie');
      expect(coupon.createdBy).toBe('meedo');
      expect(coupon.createdAt).toBeDefined();
      expect(coupon.redeemed).toBe(false);
      expect(coupon.expiresAt).toBeUndefined();
    });

    it('should create a coupon with expiration date', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const coupon = createCoupon(
        'Weekend Brunch',
        'Pick the brunch spot',
        'beedo',
        futureDate
      );

      expect(coupon.expiresAt).toBe(futureDate);
    });

    it('should send notification email when coupon is created', () => {
      createCoupon('Backrub', '10 minute massage', 'meedo');

      expect(emailsSent).toHaveLength(1);
      expect(emailsSent[0].to).toBe('beedo@example.com');
      expect(emailsSent[0].type).toBe('coupon_created');
      expect(emailsSent[0].subject).toContain('meedo');
    });

    it('should store coupon in the database', () => {
      expect(coupons).toHaveLength(0);

      createCoupon('Test Coupon', 'Description', 'meedo');

      expect(coupons).toHaveLength(1);
    });

    it('should generate unique IDs for each coupon', () => {
      const c1 = createCoupon('Coupon 1', 'Desc 1', 'meedo');
      const c2 = createCoupon('Coupon 2', 'Desc 2', 'beedo');

      expect(c1.id).not.toBe(c2.id);
    });
  });

  describe('Redeeming Coupons', () => {
    let couponId: string;

    beforeEach(() => {
      const coupon = createCoupon('Test Coupon', 'Test Description', 'meedo');
      couponId = coupon.id;
      emailsSent = []; // Clear creation notification
    });

    it('should successfully redeem a valid coupon', () => {
      const redeemed = redeemCoupon(couponId, 'beedo');

      expect(redeemed).not.toBeNull();
      expect(redeemed?.redeemed).toBe(true);
      expect(redeemed?.redeemedBy).toBe('beedo');
      expect(redeemed?.redeemedAt).toBeDefined();
    });

    it('should send notification email when coupon is redeemed', () => {
      redeemCoupon(couponId, 'beedo');

      expect(emailsSent).toHaveLength(1);
      expect(emailsSent[0].to).toBe('meedo@example.com'); // Goes to creator
      expect(emailsSent[0].type).toBe('coupon_redeemed');
    });

    it('should not allow redeeming already redeemed coupon', () => {
      // First redemption
      redeemCoupon(couponId, 'beedo');
      emailsSent = [];

      // Second attempt
      const result = redeemCoupon(couponId, 'beedo');

      expect(result).toBeNull();
      expect(emailsSent).toHaveLength(0); // No duplicate email
    });

    it('should not allow redeeming expired coupon', () => {
      // Create an expired coupon
      const expiredCoupon = createCoupon(
        'Expired Coupon',
        'This is expired',
        'meedo',
        new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
      );
      emailsSent = [];

      const result = redeemCoupon(expiredCoupon.id, 'beedo');

      expect(result).toBeNull();
    });

    it('should return null for non-existent coupon', () => {
      const result = redeemCoupon('fake_id', 'beedo');

      expect(result).toBeNull();
    });

    it('should allow redeeming coupon close to expiration', () => {
      // Create a coupon expiring in 1 hour
      const soonToExpire = createCoupon(
        'Almost Expired',
        'Quick, use it!',
        'beedo',
        new Date(Date.now() + 60 * 60 * 1000).toISOString()
      );

      const result = redeemCoupon(soonToExpire.id, 'meedo');

      expect(result).not.toBeNull();
      expect(result?.redeemed).toBe(true);
    });
  });

  describe('Email Notifications', () => {
    it('should include coupon title in creation email', () => {
      createCoupon('Special Date Night', 'Fancy dinner out', 'meedo');

      expect(emailsSent[0].body).toContain('Special Date Night');
    });

    it('should include redeemer name in redemption email', () => {
      const coupon = createCoupon('Test', 'Test', 'meedo');
      emailsSent = [];

      redeemCoupon(coupon.id, 'beedo');

      expect(emailsSent[0].body).toContain('beedo');
    });

    it('should send emails to correct recipients', () => {
      // Meedo creates, Beedo should be notified
      createCoupon('From Meedo', 'Test', 'meedo');
      expect(emailsSent[0].to).toBe('beedo@example.com');

      emailsSent = [];

      // Beedo creates, Meedo should be notified
      createCoupon('From Beedo', 'Test', 'beedo');
      expect(emailsSent[0].to).toBe('meedo@example.com');
    });
  });

  describe('Coupon Queries', () => {
    beforeEach(() => {
      // Create some test coupons
      createCoupon('Meedo Coupon 1', 'Desc', 'meedo');
      createCoupon('Meedo Coupon 2', 'Desc', 'meedo');
      createCoupon('Beedo Coupon 1', 'Desc', 'beedo');
    });

    it('should get coupons created by specific user', () => {
      const meedoCoupons = getCouponsByUser('meedo');
      const beedoCoupons = getCouponsByUser('beedo');

      expect(meedoCoupons).toHaveLength(2);
      expect(beedoCoupons).toHaveLength(1);
    });

    it('should get available coupons for a user (created by other)', () => {
      const availableForMeedo = getAvailableCoupons('meedo');
      const availableForBeedo = getAvailableCoupons('beedo');

      expect(availableForMeedo).toHaveLength(1); // Beedo's coupon
      expect(availableForBeedo).toHaveLength(2); // Meedo's coupons
    });

    it('should exclude redeemed coupons from available', () => {
      const coupon = coupons.find(c => c.createdBy === 'meedo');
      redeemCoupon(coupon!.id, 'beedo');

      const available = getAvailableCoupons('beedo');

      expect(available).toHaveLength(1); // Only 1 left
    });

    it('should get all redeemed coupons', () => {
      const coupon1 = coupons.find(c => c.createdBy === 'meedo');
      const coupon2 = coupons.find(c => c.createdBy === 'beedo');

      redeemCoupon(coupon1!.id, 'beedo');
      redeemCoupon(coupon2!.id, 'meedo');

      const redeemed = getRedeemedCoupons();

      expect(redeemed).toHaveLength(2);
    });
  });

  describe('Complete Lifecycle', () => {
    it('should handle full create -> notify -> redeem -> notify flow', () => {
      // Step 1: Meedo creates a coupon
      const coupon = createCoupon(
        'Homemade Dinner',
        'Meedo cooks your favorite meal',
        'meedo'
      );

      // Verify creation
      expect(coupon.redeemed).toBe(false);
      expect(emailsSent).toHaveLength(1);
      expect(emailsSent[0].type).toBe('coupon_created');
      expect(emailsSent[0].to).toBe('beedo@example.com');

      // Step 2: Beedo redeems the coupon
      const redeemed = redeemCoupon(coupon.id, 'beedo');

      // Verify redemption
      expect(redeemed?.redeemed).toBe(true);
      expect(redeemed?.redeemedBy).toBe('beedo');
      expect(emailsSent).toHaveLength(2);
      expect(emailsSent[1].type).toBe('coupon_redeemed');
      expect(emailsSent[1].to).toBe('meedo@example.com');

      // Step 3: Verify coupon is no longer available
      const available = getAvailableCoupons('beedo');
      expect(available.find(c => c.id === coupon.id)).toBeUndefined();
    });
  });
});
