import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendWishStatusEmail } from '@/lib/email';
import { UpdateWishStatusRequest, Wish } from '@/types/wish';

// POST - Grant or deny a wish
export async function POST(request: NextRequest) {
  try {
    const body: UpdateWishStatusRequest = await request.json();

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: id and status' },
        { status: 400 }
      );
    }

    if (!['granted', 'denied'].includes(body.status)) {
      return NextResponse.json(
        { error: 'status must be either "granted" or "denied"' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // First, fetch the original wish to get the text and wisher
    const { data: existingWish, error: fetchError } = await supabase
      .from('wishes')
      .select('*')
      .eq('id', body.id)
      .single();

    if (fetchError || !existingWish) {
      console.error('Error fetching wish:', fetchError);
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
    }

    // Update the wish status
    const updateData: Partial<Wish> = {
      status: body.status,
      granted_at: new Date().toISOString(),
    };

    if (body.status_note) {
      updateData.status_note = body.status_note.trim();
    }

    const { data, error } = await supabase
      .from('wishes')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating wish:', error);
      return NextResponse.json({ error: 'Failed to update wish' }, { status: 500 });
    }

    // Send status email to the wisher (fire and forget)
    sendWishStatusEmail({
      wishText: existingWish.text,
      wishedBy: existingWish.wished_by,
      status: body.status,
      statusNote: body.status_note,
    }).catch((err) => console.error('Status email failed:', err));

    return NextResponse.json({ wish: data as Wish });
  } catch (error) {
    console.error('Error in POST /api/wishes/grant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
