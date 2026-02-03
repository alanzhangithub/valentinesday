/**
 * Wish Lifecycle Integration Tests
 *
 * Tests the complete wish (wishing well) flow:
 * - Submitting wishes to Mod
 * - Status tracking (pending -> granted/denied)
 * - Email notifications
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Types
type UserId = 'meedo' | 'beedo';
type WishStatus = 'pending' | 'granted' | 'denied';

interface Wish {
  id: string;
  text: string;
  wishedBy: UserId;
  wishedAt: string;
  status: WishStatus;
  statusNote?: string;
  grantedAt?: string;
  deniedAt?: string;
  reviewedBy?: UserId;
}

interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  type: 'wish_submitted' | 'wish_granted' | 'wish_denied';
}

// Mock data stores
let wishes: Wish[];
let emailsSent: EmailNotification[];

// Mock email addresses
const USER_EMAILS: Record<UserId, string> = {
  meedo: 'meedo@example.com',
  beedo: 'beedo@example.com',
};

// Admin (Mod) is Meedo
const MOD_USER: UserId = 'meedo';

// Helper functions
const submitWish = (text: string, wishedBy: UserId): Wish => {
  const wish: Wish = {
    id: `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    wishedBy,
    wishedAt: new Date().toISOString(),
    status: 'pending',
  };
  wishes.push(wish);

  // Send notification to Mod (admin)
  sendEmail({
    to: USER_EMAILS[MOD_USER],
    subject: `New wish from ${wishedBy}!`,
    body: `${wishedBy} wishes upon Mod: "${text}"`,
    type: 'wish_submitted',
  });

  return wish;
};

const grantWish = (wishId: string, note?: string, reviewedBy: UserId = MOD_USER): Wish | null => {
  const wish = wishes.find(w => w.id === wishId);
  if (!wish) return null;

  // Can only grant pending wishes
  if (wish.status !== 'pending') return null;

  wish.status = 'granted';
  wish.grantedAt = new Date().toISOString();
  wish.statusNote = note;
  wish.reviewedBy = reviewedBy;

  // Notify the wisher
  sendEmail({
    to: USER_EMAILS[wish.wishedBy],
    subject: 'Your wish has been granted!',
    body: `Mod has granted your wish: "${wish.text}"${note ? `\n\nMod says: "${note}"` : ''}`,
    type: 'wish_granted',
  });

  return wish;
};

const denyWish = (wishId: string, reason?: string, reviewedBy: UserId = MOD_USER): Wish | null => {
  const wish = wishes.find(w => w.id === wishId);
  if (!wish) return null;

  // Can only deny pending wishes
  if (wish.status !== 'pending') return null;

  wish.status = 'denied';
  wish.deniedAt = new Date().toISOString();
  wish.statusNote = reason;
  wish.reviewedBy = reviewedBy;

  // Notify the wisher
  sendEmail({
    to: USER_EMAILS[wish.wishedBy],
    subject: 'Mod has responded to your wish',
    body: `Mod has denied your wish: "${wish.text}"${reason ? `\n\nMod says: "${reason}"` : ''}`,
    type: 'wish_denied',
  });

  return wish;
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

const getWishesByUser = (userId: UserId): Wish[] => {
  return wishes.filter(w => w.wishedBy === userId);
};

const getWishesByStatus = (status: WishStatus): Wish[] => {
  return wishes.filter(w => w.status === status);
};

const getPendingWishes = (): Wish[] => {
  return getWishesByStatus('pending');
};

describe('Wish Lifecycle Integration', () => {
  beforeEach(() => {
    wishes = [];
    emailsSent = [];
  });

  describe('Submitting Wishes', () => {
    it('should create a wish with all required fields', () => {
      const wish = submitWish('I want boba', 'beedo');

      expect(wish.id).toBeDefined();
      expect(wish.text).toBe('I want boba');
      expect(wish.wishedBy).toBe('beedo');
      expect(wish.wishedAt).toBeDefined();
      expect(wish.status).toBe('pending');
    });

    it('should send notification email to Mod when wish is submitted', () => {
      submitWish('Please grant me a day off', 'beedo');

      expect(emailsSent).toHaveLength(1);
      expect(emailsSent[0].to).toBe('meedo@example.com'); // Mod is Meedo
      expect(emailsSent[0].type).toBe('wish_submitted');
      expect(emailsSent[0].body).toContain('beedo wishes upon Mod');
    });

    it('should store wish in the database', () => {
      expect(wishes).toHaveLength(0);

      submitWish('A new wish', 'meedo');

      expect(wishes).toHaveLength(1);
    });

    it('should generate unique IDs for each wish', () => {
      const w1 = submitWish('Wish 1', 'beedo');
      const w2 = submitWish('Wish 2', 'beedo');

      expect(w1.id).not.toBe(w2.id);
    });

    it('should handle wish from either user', () => {
      const meedoWish = submitWish('Meedo wish', 'meedo');
      const beedoWish = submitWish('Beedo wish', 'beedo');

      expect(meedoWish.wishedBy).toBe('meedo');
      expect(beedoWish.wishedBy).toBe('beedo');
    });
  });

  describe('Granting Wishes', () => {
    let wishId: string;

    beforeEach(() => {
      const wish = submitWish('Test wish', 'beedo');
      wishId = wish.id;
      emailsSent = []; // Clear submission notification
    });

    it('should successfully grant a pending wish', () => {
      const granted = grantWish(wishId);

      expect(granted).not.toBeNull();
      expect(granted?.status).toBe('granted');
      expect(granted?.grantedAt).toBeDefined();
    });

    it('should include optional note when granting', () => {
      const granted = grantWish(wishId, 'Your wish is my command!');

      expect(granted?.statusNote).toBe('Your wish is my command!');
    });

    it('should send notification email when wish is granted', () => {
      grantWish(wishId);

      expect(emailsSent).toHaveLength(1);
      expect(emailsSent[0].to).toBe('beedo@example.com'); // Goes to wisher
      expect(emailsSent[0].type).toBe('wish_granted');
      expect(emailsSent[0].subject).toContain('granted');
    });

    it('should not grant already granted wish', () => {
      grantWish(wishId);
      emailsSent = [];

      const result = grantWish(wishId);

      expect(result).toBeNull();
      expect(emailsSent).toHaveLength(0);
    });

    it('should not grant already denied wish', () => {
      denyWish(wishId);
      emailsSent = [];

      const result = grantWish(wishId);

      expect(result).toBeNull();
    });

    it('should return null for non-existent wish', () => {
      const result = grantWish('fake_id');

      expect(result).toBeNull();
    });
  });

  describe('Denying Wishes', () => {
    let wishId: string;

    beforeEach(() => {
      const wish = submitWish('Unreasonable request', 'beedo');
      wishId = wish.id;
      emailsSent = [];
    });

    it('should successfully deny a pending wish', () => {
      const denied = denyWish(wishId);

      expect(denied).not.toBeNull();
      expect(denied?.status).toBe('denied');
      expect(denied?.deniedAt).toBeDefined();
    });

    it('should include optional reason when denying', () => {
      const denied = denyWish(wishId, 'Too expensive');

      expect(denied?.statusNote).toBe('Too expensive');
    });

    it('should send notification email when wish is denied', () => {
      denyWish(wishId, 'Maybe next time');

      expect(emailsSent).toHaveLength(1);
      expect(emailsSent[0].to).toBe('beedo@example.com');
      expect(emailsSent[0].type).toBe('wish_denied');
      expect(emailsSent[0].body).toContain('Maybe next time');
    });

    it('should not deny already granted wish', () => {
      grantWish(wishId);
      emailsSent = [];

      const result = denyWish(wishId);

      expect(result).toBeNull();
    });

    it('should not deny already denied wish', () => {
      denyWish(wishId);
      emailsSent = [];

      const result = denyWish(wishId);

      expect(result).toBeNull();
    });
  });

  describe('Status Tracking', () => {
    beforeEach(() => {
      // Create wishes with different statuses
      const w1 = submitWish('Pending wish 1', 'beedo');
      const w2 = submitWish('Pending wish 2', 'beedo');
      const w3 = submitWish('To be granted', 'meedo');
      const w4 = submitWish('To be denied', 'beedo');

      grantWish(w3.id);
      denyWish(w4.id);
      emailsSent = [];
    });

    it('should get all pending wishes', () => {
      const pending = getPendingWishes();

      expect(pending).toHaveLength(2);
      expect(pending.every(w => w.status === 'pending')).toBe(true);
    });

    it('should get wishes by status', () => {
      const granted = getWishesByStatus('granted');
      const denied = getWishesByStatus('denied');
      const pending = getWishesByStatus('pending');

      expect(granted).toHaveLength(1);
      expect(denied).toHaveLength(1);
      expect(pending).toHaveLength(2);
    });

    it('should get wishes by user', () => {
      const beedoWishes = getWishesByUser('beedo');
      const meedoWishes = getWishesByUser('meedo');

      expect(beedoWishes).toHaveLength(3);
      expect(meedoWishes).toHaveLength(1);
    });
  });

  describe('Email Notifications', () => {
    it('should include wish text in submission email', () => {
      submitWish('I really want ice cream', 'beedo');

      expect(emailsSent[0].body).toContain('I really want ice cream');
    });

    it('should include Mod note in granted email', () => {
      const wish = submitWish('Test', 'beedo');
      emailsSent = [];

      grantWish(wish.id, 'Here you go!');

      expect(emailsSent[0].body).toContain('Here you go!');
    });

    it('should include reason in denied email', () => {
      const wish = submitWish('Test', 'beedo');
      emailsSent = [];

      denyWish(wish.id, 'Not today');

      expect(emailsSent[0].body).toContain('Not today');
    });
  });

  describe('Complete Lifecycle', () => {
    it('should handle submit -> pending -> granted flow', () => {
      // Step 1: Beedo submits a wish
      const wish = submitWish('I want a puppy', 'beedo');

      // Verify submission
      expect(wish.status).toBe('pending');
      expect(emailsSent).toHaveLength(1);
      expect(emailsSent[0].type).toBe('wish_submitted');
      expect(emailsSent[0].to).toBe('meedo@example.com');

      // Step 2: Mod (Meedo) grants the wish
      const granted = grantWish(wish.id, 'One puppy coming up!');

      // Verify grant
      expect(granted?.status).toBe('granted');
      expect(emailsSent).toHaveLength(2);
      expect(emailsSent[1].type).toBe('wish_granted');
      expect(emailsSent[1].to).toBe('beedo@example.com');
    });

    it('should handle submit -> pending -> denied flow', () => {
      // Step 1: Beedo submits a wish
      const wish = submitWish('Buy me a yacht', 'beedo');

      expect(wish.status).toBe('pending');

      // Step 2: Mod denies the wish
      const denied = denyWish(wish.id, 'We need to save money');

      expect(denied?.status).toBe('denied');
      expect(denied?.statusNote).toBe('We need to save money');
      expect(emailsSent).toHaveLength(2);
      expect(emailsSent[1].type).toBe('wish_denied');
    });

    it('should handle multiple wishes from same user', () => {
      submitWish('Wish 1', 'beedo');
      submitWish('Wish 2', 'beedo');
      submitWish('Wish 3', 'beedo');

      const beedoWishes = getWishesByUser('beedo');

      expect(beedoWishes).toHaveLength(3);
      expect(emailsSent).toHaveLength(3);
    });
  });
});
