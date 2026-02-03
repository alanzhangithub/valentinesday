import { NextRequest, NextResponse } from 'next/server';
import { createPurchase, getBalance, getShopItem, fulfillPurchase, getPurchases } from '@/lib/shop-data';
import { sendPurchaseConfirmation, sendAdminNotification } from '@/lib/email';
import { PurchaseRequest, PurchaseResponse, User } from '@/types/shop';

// POST /api/shop/purchase - Purchase an item
export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json();
    const { item_id, user } = body;

    // Validate input
    if (!item_id || !user) {
      return NextResponse.json(
        { success: false, error: 'Missing item_id or user' },
        { status: 400 }
      );
    }

    if (user !== 'meedo' && user !== 'beedo') {
      return NextResponse.json(
        { success: false, error: 'Invalid user' },
        { status: 400 }
      );
    }

    // Attempt purchase (atomic coin deduction)
    const result = createPurchase(item_id, user);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const item = getShopItem(item_id);
    if (result.purchase && item) {
      // Send confirmation emails
      await sendPurchaseConfirmation(result.purchase, item, user);
      await sendAdminNotification(result.purchase, item, user);
    }

    const newBalance = getBalance(user);

    const response: PurchaseResponse = {
      success: true,
      purchase: result.purchase,
      new_balance: newBalance,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}

// GET /api/shop/purchase - Get purchase history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') as User | null;

    const purchases = getPurchases(user ?? undefined);

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}

// PATCH /api/shop/purchase - Mark purchase as fulfilled (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { purchase_id } = body;

    if (!purchase_id) {
      return NextResponse.json(
        { success: false, error: 'Missing purchase_id' },
        { status: 400 }
      );
    }

    const result = fulfillPurchase(purchase_id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error fulfilling purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fulfill purchase' },
      { status: 500 }
    );
  }
}
