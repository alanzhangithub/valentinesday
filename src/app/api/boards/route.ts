/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — supabase-js v2.49 insert/update type resolution issue with hand-written Database types
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { Board, BoardInsert, BoardUpdate, ApiResponse, CanvasData } from '@/types/database';

// GET /api/boards - List all boards
// GET /api/boards?id=xxx - Get single board
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      // Get single board
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json<ApiResponse<Board>>({
          data: null,
          error: error.message,
          success: false,
        }, { status: 404 });
      }

      return NextResponse.json<ApiResponse<Board>>({
        data,
        error: null,
        success: true,
      });
    }

    // List all boards
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json<ApiResponse<Board[]>>({
        data: null,
        error: error.message,
        success: false,
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Board[]>>({
      data,
      error: null,
      success: true,
    });
  } catch (err) {
    console.error('GET /api/boards error:', err);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: 'Internal server error',
      success: false,
    }, { status: 500 });
  }
}

// POST /api/boards - Create new board
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { name, created_by } = body as { name: string; created_by: 'meedo' | 'beedo' };

    if (!name || !created_by) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'Missing required fields: name, created_by',
        success: false,
      }, { status: 400 });
    }

    const newBoard: BoardInsert = {
      name,
      created_by,
      canvas_data: { stickers: [] } as CanvasData,
    };

    const { data, error } = await supabase
      .from('boards')
      .insert(newBoard)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: error.message,
        success: false,
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Board>>({
      data,
      error: null,
      success: true,
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/boards error:', err);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: 'Internal server error',
      success: false,
    }, { status: 500 });
  }
}

// PATCH /api/boards - Update board (canvas data, name)
export async function PATCH(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { id, name, canvas_data } = body as {
      id: string;
      name?: string;
      canvas_data?: CanvasData;
    };

    if (!id) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'Missing required field: id',
        success: false,
      }, { status: 400 });
    }

    const updates: BoardUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (canvas_data !== undefined) updates.canvas_data = canvas_data;

    const { data, error } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: error.message,
        success: false,
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Board>>({
      data,
      error: null,
      success: true,
    });
  } catch (err) {
    console.error('PATCH /api/boards error:', err);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: 'Internal server error',
      success: false,
    }, { status: 500 });
  }
}

// DELETE /api/boards - Delete board
export async function DELETE(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'Missing required param: id',
        success: false,
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: error.message,
        success: false,
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: null,
      success: true,
    });
  } catch (err) {
    console.error('DELETE /api/boards error:', err);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: 'Internal server error',
      success: false,
    }, { status: 500 });
  }
}
