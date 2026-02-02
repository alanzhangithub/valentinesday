import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendWishNotification } from '@/lib/email';
import { CreateWishRequest, Wish } from '@/types/wish';

// GET - Fetch all wishes
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('wished_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishes:', error);
      return NextResponse.json({ error: 'Failed to fetch wishes' }, { status: 500 });
    }

    return NextResponse.json({ wishes: data as Wish[] });
  } catch (error) {
    console.error('Error in GET /api/wishes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new wish
export async function POST(request: NextRequest) {
  try {
    const body: CreateWishRequest = await request.json();

    if (!body.text || !body.wished_by) {
      return NextResponse.json(
        { error: 'Missing required fields: text and wished_by' },
        { status: 400 }
      );
    }

    if (!['meedo', 'beedo'].includes(body.wished_by)) {
      return NextResponse.json(
        { error: 'wished_by must be either "meedo" or "beedo"' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const newWish = {
      text: body.text.trim(),
      wished_by: body.wished_by,
      wished_at: new Date().toISOString(),
      status: 'pending' as const,
    };

    const { data, error } = await supabase
      .from('wishes')
      .insert(newWish)
      .select()
      .single();

    if (error) {
      console.error('Error creating wish:', error);
      return NextResponse.json({ error: 'Failed to create wish' }, { status: 500 });
    }

    // Send email notification (fire and forget, don't block response)
    sendWishNotification({
      wishText: newWish.text,
      wishedBy: newWish.wished_by,
      wishedAt: newWish.wished_at,
    }).catch((err) => console.error('Email notification failed:', err));

    return NextResponse.json({ wish: data as Wish }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/wishes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a wish by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing wish ID' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase.from('wishes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting wish:', error);
      return NextResponse.json({ error: 'Failed to delete wish' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/wishes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
