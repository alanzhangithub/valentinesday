/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — supabase-js v2.49 insert/update type resolution issue with hand-written Database types
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse, Stamp } from '@/types/database';

// PUT /api/calendar/stamps/[id] - Update stamp definition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, emoji, color } = body;

    const updates: Record<string, string> = {};
    if (name) updates.name = name;
    if (emoji) updates.emoji = emoji;
    if (color) updates.color = color;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'no fields to update',
        success: false,
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('stamps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Stamp>>({
      data,
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to update stamp',
      success: false,
    }, { status: 500 });
  }
}

// DELETE /api/calendar/stamps/[id] - Delete stamp (cascades to placements)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('stamps')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to delete stamp',
      success: false,
    }, { status: 500 });
  }
}
