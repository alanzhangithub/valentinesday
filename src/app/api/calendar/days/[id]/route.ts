import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse } from '@/types/database';

// DELETE /api/calendar/days/[id] - Remove a stamp placement
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('day_stamps')
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
      error: err instanceof Error ? err.message : 'failed to remove stamp',
      success: false,
    }, { status: 500 });
  }
}
