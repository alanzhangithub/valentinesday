import { NextRequest, NextResponse } from 'next/server';
import { RedeemCouponRequest } from '@/types/coupon';
import { findCoupon, updateCoupon } from '@/lib/coupons-store';

// POST /api/coupons/redeem - redeem a coupon
export async function POST(request: NextRequest) {
  try {
    const body: RedeemCouponRequest = await request.json();

    // validation
    if (!body.coupon_id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }
    if (!body.redeemed_by || !['meedo', 'beedo'].includes(body.redeemed_by)) {
      return NextResponse.json({ error: 'Invalid redeemer' }, { status: 400 });
    }

    const coupon = findCoupon(body.coupon_id);

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    if (coupon.redeemed) {
      return NextResponse.json({ error: 'Coupon already redeemed' }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    // actually update the coupon in the store
    const redeemedCoupon = updateCoupon(body.coupon_id, {
      redeemed: true,
      redeemed_at: new Date().toISOString(),
      redeemed_by: body.redeemed_by,
    });

    if (!redeemedCoupon) {
      return NextResponse.json({ error: 'Failed to redeem coupon' }, { status: 500 });
    }

    // cute message based on who redeemed and who created
    const redeemer = body.redeemed_by === 'meedo' ? 'Meedo' : 'Beedo';
    const creator = coupon.created_by === 'meedo' ? 'Meedo' : 'Beedo';

    return NextResponse.json({
      coupon: redeemedCoupon,
      message: `${redeemer} just redeemed "${coupon.title}"! time for ${creator} to deliver~`,
    });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json({ error: 'Failed to redeem coupon' }, { status: 500 });
  }
}
