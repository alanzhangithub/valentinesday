/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — supabase-js v2.49 generic type resolution fails for user_badges table
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { UserRole, ApiResponse, UserBadge } from '@/types/database';

interface AwardBadgeRequest {
  user_role: UserRole;
  badge_id: string;
}

// POST /api/badges/award - Award a badge to a user
export async function POST(request: NextRequest) {
  try {
    const body: AwardBadgeRequest = await request.json();
    const { user_role, badge_id } = body;

    // Validate required fields
    if (!user_role || !['meedo', 'beedo'].includes(user_role)) {
      const response: ApiResponse<null> = {
        data: null,
        error: 'user_role required (meedo or beedo)',
        success: false,
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!badge_id) {
      const response: ApiResponse<null> = {
        data: null,
        error: 'badge_id required',
        success: false,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const supabase = createServerClient();

    // Check if badge exists
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('*')
      .eq('id', badge_id)
      .single();

    if (badgeError || !badge) {
      const response: ApiResponse<null> = {
        data: null,
        error: 'Badge not found',
        success: false,
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if user already has this badge
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: existingBadge, error: _existingError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_role', user_role)
      .eq('badge_id', badge_id)
      .single();

    if (existingBadge) {
      // Already has the badge - return success but indicate it was already earned
      const response: ApiResponse<{ badge: typeof badge; already_earned: boolean }> = {
        data: { badge, already_earned: true },
        error: null,
        success: true,
      };
      return NextResponse.json(response);
    }

    // Award the badge
    const { data: newUserBadge, error: insertError } = await supabase
      .from('user_badges')
      .insert({
        user_role,
        badge_id,
      })
      .select()
      .single();

    if (insertError) {
      const response: ApiResponse<null> = {
        data: null,
        error: insertError.message,
        success: false,
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse<{ badge: typeof badge; user_badge: UserBadge; already_earned: boolean }> = {
      data: { badge, user_badge: newUserBadge, already_earned: false },
      error: null,
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Failed to award badge:', error);
    const response: ApiResponse<null> = {
      data: null,
      error: 'Failed to award badge',
      success: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// GET /api/badges/award - Check which badges a user qualifies for
// This is useful for triggering badge checks after actions
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

    // Get badges the user doesn't have yet
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_role', userRole);

    const earnedIds = userBadges?.map(ub => ub.badge_id) || [];

    // Get all badges
    const { data: allBadges, error } = await supabase
      .from('badges')
      .select('*');

    if (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: error.message,
        success: false,
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Filter to unearned badges
    const unearnedBadges = allBadges?.filter(b => !earnedIds.includes(b.id)) || [];

    // Check qualifications for each unearned badge
    // This is where you'd add logic to check if user qualifies
    // For now, just return the list of unearned badges
    const qualifiedBadges = await checkBadgeQualifications(supabase, userRole, unearnedBadges);

    const response: ApiResponse<typeof qualifiedBadges> = {
      data: qualifiedBadges,
      error: null,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to check badge qualifications:', error);
    const response: ApiResponse<null> = {
      data: null,
      error: 'Failed to check badge qualifications',
      success: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// Helper to check which badges a user qualifies for
// Add more badge logic here as needed
async function checkBadgeQualifications(
  supabase: ReturnType<typeof createServerClient>,
  userRole: UserRole,
  unearnedBadges: { id: string; name: string; description: string | null; icon: string | null }[]
) {
  const qualified = [];

  for (const badge of unearnedBadges) {
    let qualifies = false;

    // Badge-specific logic based on badge ID or name
    switch (badge.id) {
      case 'first-visit':
        // Always qualifies if they're here
        qualifies = true;
        break;

      case 'first-coupon':
        // Check if they've redeemed any coupons
        const { count: couponCount } = await supabase
          .from('coupons')
          .select('*', { count: 'exact', head: true })
          .eq('redeemed_by', userRole);
        qualifies = (couponCount || 0) >= 1;
        break;

      case 'spelling-champion':
        // Would need a games/scores table to check this
        // For now, skip
        break;

      case 'big-spender':
        // Check if they've spent 1000+ coins
        const { data: balance } = await supabase
          .from('user_balances')
          .select('total_spent')
          .eq('user_role', userRole)
          .single();
        qualifies = (balance?.total_spent || 0) >= 1000;
        break;

      // Add more badge checks as needed
    }

    if (qualifies) {
      qualified.push(badge);
    }
  }

  return qualified;
}
