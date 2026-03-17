/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — supabase-js v2.49 insert/update type resolution issue with hand-written Database types
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse, Stamp } from '@/types/database';

// GET /api/calendar/stamps - List all stamp definitions
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('stamps')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json<ApiResponse<Stamp[]>>({
      data: data || [],
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to fetch stamps',
      success: false,
    }, { status: 500 });
  }
}

// POST /api/calendar/stamps - Create a new stamp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, emoji, color, created_by } = body;

    if (!name || !emoji || !color || !created_by) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'missing required fields: name, emoji, color, created_by',
        success: false,
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('stamps')
      .insert({ name, emoji, color, created_by })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Stamp>>({
      data,
      error: null,
      success: true,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to create stamp',
      success: false,
    }, { status: 500 });
  }
}
