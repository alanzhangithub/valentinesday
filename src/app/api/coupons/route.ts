import { NextRequest, NextResponse } from 'next/server';
import { Coupon, CreateCouponRequest } from '@/types/coupon';

// in-memory storage for now - will be replaced with supabase
// TODO: replace with supabase when database worktree is merged
let coupons: Coupon[] = [
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
    title: 'Boba Run',
    description: 'I will go get us boba, your pick of flavors!',
    created_by: 'meedo',
    created_at: new Date('2026-01-10').toISOString(),
    expires_at: new Date('2026-01-20').toISOString(),
    redeemed: false,
  },
];

// GET /api/coupons - get all coupons
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter'); // 'available', 'redeemed', 'expired', or null for all
  const createdBy = searchParams.get('created_by'); // 'meedo' or 'beedo'

  let filteredCoupons = [...coupons];

  // filter by creator
  if (createdBy === 'meedo' || createdBy === 'beedo') {
    filteredCoupons = filteredCoupons.filter((c) => c.created_by === createdBy);
  }

  // filter by status
  const now = new Date();
  switch (filter) {
    case 'available':
      filteredCoupons = filteredCoupons.filter(
        (c) => !c.redeemed && (!c.expires_at || new Date(c.expires_at) >= now)
      );
      break;
    case 'redeemed':
      filteredCoupons = filteredCoupons.filter((c) => c.redeemed);
      break;
    case 'expired':
      filteredCoupons = filteredCoupons.filter(
        (c) => !c.redeemed && c.expires_at && new Date(c.expires_at) < now
      );
      break;
    // no filter = return all
  }

  // sort by created_at descending (newest first)
  filteredCoupons.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ coupons: filteredCoupons });
}

// POST /api/coupons - create a new coupon
export async function POST(request: NextRequest) {
  try {
    const body: CreateCouponRequest = await request.json();

    // validation
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!body.created_by || !['meedo', 'beedo'].includes(body.created_by)) {
      return NextResponse.json({ error: 'Invalid creator' }, { status: 400 });
    }

    const newCoupon: Coupon = {
      id: crypto.randomUUID(),
      title: body.title.trim(),
      description: body.description.trim(),
      created_by: body.created_by,
      created_at: new Date().toISOString(),
      expires_at: body.expires_at,
      redeemed: false,
    };

    coupons.push(newCoupon);

    return NextResponse.json({ coupon: newCoupon }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

// DELETE /api/coupons?id=xxx - delete a coupon
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
  }

  const index = coupons.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  }

  coupons.splice(index, 1);

  return NextResponse.json({ success: true });
}
