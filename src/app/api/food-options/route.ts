import { NextRequest, NextResponse } from 'next/server';
import { FoodOption, RecentPick } from '@/types/food';

// In-memory storage for now - will be replaced with Supabase
let foodOptions: FoodOption[] = [
  {
    id: '1',
    name: 'Chipotle',
    cuisine: 'Mexican',
    priceRange: '$',
    weight: 3,
    addedBy: 'meedo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Panda Express',
    cuisine: 'Chinese',
    priceRange: '$',
    weight: 2,
    addedBy: 'beedo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Olive Garden',
    cuisine: 'Italian',
    priceRange: '$$',
    weight: 4,
    addedBy: 'meedo',
    createdAt: new Date().toISOString(),
  },
];

let recentPicks: RecentPick[] = [];

// GET - fetch all food options
export async function GET() {
  return NextResponse.json({
    foodOptions,
    recentPicks: recentPicks.slice(0, 10), // last 10 picks
  });
}

// POST - add new food option
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newOption: FoodOption = {
      id: Date.now().toString(),
      name: body.name,
      cuisine: body.cuisine || undefined,
      priceRange: body.priceRange || undefined,
      location: body.location || undefined,
      addedBy: body.addedBy || 'meedo',
      weight: body.weight || 3,
      createdAt: new Date().toISOString(),
    };

    foodOptions.push(newOption);

    return NextResponse.json(newOption, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// PUT - update food option or record a pick
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Record a pick
    if (body.action === 'pick') {
      const pick: RecentPick = {
        id: Date.now().toString(),
        foodOptionId: body.foodOptionId,
        foodOptionName: body.foodOptionName,
        pickedAt: new Date().toISOString(),
        wasRerolled: body.wasRerolled || false,
      };
      recentPicks.unshift(pick);
      return NextResponse.json(pick);
    }

    // Update food option
    const index = foodOptions.findIndex(f => f.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    foodOptions[index] = {
      ...foodOptions[index],
      ...body,
    };

    return NextResponse.json(foodOptions[index]);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE - remove food option
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const index = foodOptions.findIndex(f => f.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    foodOptions.splice(index, 1);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
