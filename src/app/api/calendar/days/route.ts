/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — supabase-js v2.49 insert/update type resolution issue with hand-written Database types
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse, DayStampWithStamp } from '@/types/database';

// GET /api/calendar/days?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'from and to query params required (YYYY-MM-DD)',
        success: false,
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('day_stamps')
      .select('*, stamp:stamps(*)')
      .gte('date', from)
      .lte('date', to)
      .order('placed_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json<ApiResponse<DayStampWithStamp[]>>({
      data: (data || []) as DayStampWithStamp[],
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to fetch day stamps',
      success: false,
    }, { status: 500 });
  }
}

// POST /api/calendar/days - Place a stamp on a day
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stamp_id, date, placed_by } = body;

    if (!stamp_id || !date || !placed_by) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'missing required fields: stamp_id, date, placed_by',
        success: false,
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('day_stamps')
      .insert({ stamp_id, date, placed_by })
      .select('*, stamp:stamps(*)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json<ApiResponse<null>>({
          data: null,
          error: 'this stamp is already on this day',
          success: false,
        }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json<ApiResponse<DayStampWithStamp>>({
      data: data as DayStampWithStamp,
      error: null,
      success: true,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to place stamp',
      success: false,
    }, { status: 500 });
  }
}
