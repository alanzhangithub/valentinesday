import { NextRequest, NextResponse } from 'next/server';
import { getBalance, updateBalance } from '@/lib/shop-data';
import { CoinBalanceResponse, UpdateCoinsRequest, User } from '@/types/shop';

// GET /api/coins?user=meedo|beedo - Get coin balance for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') as User | null;

    if (!user) {
      return NextResponse.json(
        { error: 'Missing user parameter' },
        { status: 400 }
      );
    }

    if (user !== 'meedo' && user !== 'beedo') {
      return NextResponse.json(
        { error: 'Invalid user. Must be "meedo" or "beedo"' },
        { status: 400 }
      );
    }

    const coins = getBalance(user);

    const response: CoinBalanceResponse = {
      user,
      coins,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coin balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin balance' },
      { status: 500 }
    );
  }
}

// POST /api/coins - Update coin balance (used by games, admin)
export async function POST(request: NextRequest) {
  try {
    const body: UpdateCoinsRequest = await request.json();
    const { user, amount, operation } = body;

    // Validate input
    if (!user || amount === undefined || !operation) {
      return NextResponse.json(
        { error: 'Missing required fields: user, amount, operation' },
        { status: 400 }
      );
    }

    if (user !== 'meedo' && user !== 'beedo') {
      return NextResponse.json(
        { error: 'Invalid user. Must be "meedo" or "beedo"' },
        { status: 400 }
      );
    }

    if (!['add', 'subtract', 'set'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation. Must be "add", "subtract", or "set"' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be a non-negative number' },
        { status: 400 }
      );
    }

    const newBalance = updateBalance(user, amount, operation);

    const response: CoinBalanceResponse = {
      user,
      coins: newBalance,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating coin balance:', error);
    return NextResponse.json(
      { error: 'Failed to update coin balance' },
      { status: 500 }
    );
  }
}
