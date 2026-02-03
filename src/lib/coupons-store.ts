import { Coupon } from '@/types/coupon';

// in-memory storage for coupons - will be replaced with supabase
// TODO: replace with supabase when database worktree is merged
export const couponsStore: Coupon[] = [
  {
    id: '1',
    title: 'Movie Night Pick',
    description: 'You get to pick the movie tonight, no complaints from me!',
    created_by: 'meedo',
    created_at: new Date('2026-01-15').toISOString(),
    redeemed: false,
  },
  {
    id: '2',
    title: 'Breakfast in Bed',
    description: 'Wake up to your favorite breakfast served in bed!',
    created_by: 'beedo',
    created_at: new Date('2026-01-20').toISOString(),
    redeemed: true,
    redeemed_at: new Date('2026-01-25').toISOString(),
    redeemed_by: 'meedo',
  },
  {
    id: '3',
    title: 'One Free Backrub',
    description: 'A nice 15-minute backrub whenever you want it. no questions asked.',
    created_by: 'meedo',
    created_at: new Date('2026-01-28').toISOString(),
    redeemed: false,
  },
  {
    id: '4',
    title: 'Boba Run',
    description: 'I will go get us boba, your pick of flavors!',
    created_by: 'meedo',
    created_at: new Date('2026-01-10').toISOString(),
    expires_at: new Date('2026-01-20').toISOString(),
    redeemed: false,
  },
  {
    id: '5',
    title: 'Date Night Planning',
    description: 'I plan the whole date from start to finish. you just show up looking cute.',
    created_by: 'beedo',
    created_at: new Date('2026-02-01').toISOString(),
    redeemed: false,
  },
];

// helper functions for the store
export function getCoupons(): Coupon[] {
  return [...couponsStore];
}

export function addCoupon(coupon: Coupon): void {
  couponsStore.push(coupon);
}

export function findCoupon(id: string): Coupon | undefined {
  return couponsStore.find((c) => c.id === id);
}

export function updateCoupon(id: string, updates: Partial<Coupon>): Coupon | null {
  const index = couponsStore.findIndex((c) => c.id === id);
  if (index === -1) return null;

  couponsStore[index] = { ...couponsStore[index], ...updates };
  return couponsStore[index];
}

export function deleteCoupon(id: string): boolean {
  const index = couponsStore.findIndex((c) => c.id === id);
  if (index === -1) return false;

  couponsStore.splice(index, 1);
  return true;
}
