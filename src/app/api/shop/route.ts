import { NextResponse } from 'next/server';
import { getShopItems } from '@/lib/shop-data';
import { ShopResponse } from '@/types/shop';

// GET /api/shop - Get all available shop items
export async function GET() {
  try {
    const items = getShopItems();

    const response: ShopResponse = {
      items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop items' },
      { status: 500 }
    );
  }
}
