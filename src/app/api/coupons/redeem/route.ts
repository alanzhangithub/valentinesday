import { NextRequest, NextResponse } from 'next/server';
import { Coupon, RedeemCouponRequest } from '@/types/coupon';

// shared reference to coupons array - in production this would be supabase
// importing from parent route won't work with isolated module state
// TODO: replace with supabase when database worktree is merged

// for now, we'll fetch and update via the parent route
// this is a workaround until we have a proper database

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

    // fetch current coupons from the main route
    const baseUrl = request.nextUrl.origin;
    const couponsResponse = await fetch(`${baseUrl}/api/coupons`);
    const { coupons } = await couponsResponse.json();

    const coupon = coupons.find((c: Coupon) => c.id === body.coupon_id);

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    if (coupon.redeemed) {
      return NextResponse.json({ error: 'Coupon already redeemed' }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    // in a real implementation, we'd update the database here
    // for now, return the redeemed coupon state
    const redeemedCoupon: Coupon = {
      ...coupon,
      redeemed: true,
      redeemed_at: new Date().toISOString(),
      redeemed_by: body.redeemed_by,
    };

    // TODO: send email notification when redeemed
    // await sendRedemptionEmail(coupon, body.redeemed_by);

    return NextResponse.json({
      coupon: redeemedCoupon,
      message: `${body.redeemed_by} just redeemed "${coupon.title}"! time to deliver!`,
    });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json({ error: 'Failed to redeem coupon' }, { status: 500 });
  }
}
