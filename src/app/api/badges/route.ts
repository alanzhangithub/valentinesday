import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { UserRole, UserBadgeWithDetails, ApiResponse } from '@/types/database';

// GET /api/badges - Get badges for a user
// Query params: user_role (required: 'meedo' | 'beedo')
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userRole = searchParams.get('user_role') as UserRole | null;

    if (!userRole || !['meedo', 'beedo'].includes(userRole)) {
      const response: ApiResponse<null> = {
        data: null,
        error: 'user_role query param required (meedo or beedo)',
        success: false,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const supabase = createServerClient();

    // Get all badges the user has earned with badge details
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select(`
        id,
        user_role,
        badge_id,
        earned_at,
        badge:badges(id, name, description, icon)
      `)
      .eq('user_role', userRole)
      .order('earned_at', { ascending: false });

    if (userBadgesError) {
      const response: ApiResponse<null> = {
        data: null,
        error: userBadgesError.message,
        success: false,
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Get all available badges
    const { data: allBadges, error: allBadgesError } = await supabase
      .from('badges')
      .select('*')
      .order('name');

    if (allBadgesError) {
      const response: ApiResponse<null> = {
        data: null,
        error: allBadgesError.message,
        success: false,
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Transform the data to include earned status
    const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

    const badgesWithStatus = allBadges?.map(badge => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      earned_at: userBadges?.find(ub => ub.badge_id === badge.id)?.earned_at || null,
    })) || [];

    const response: ApiResponse<typeof badgesWithStatus> = {
      data: badgesWithStatus,
      error: null,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch badges:', error);
    const response: ApiResponse<null> = {
      data: null,
      error: 'Failed to fetch badges',
      success: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
