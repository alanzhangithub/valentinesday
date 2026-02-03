// Calendar Sync API - Sync with Google Calendar
// POST: Trigger a sync (pull from Google Calendar)
// This endpoint fetches events from Google Calendar and can be used
// to ensure our view is up-to-date with any external changes

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchGoogleCalendarEvents,
  fromGoogleEvent,
} from '@/lib/google-calendar';
import { CalendarEvent } from '@/types/calendar';

export interface SyncResult {
  success: boolean;
  events: Partial<CalendarEvent>[];
  syncedAt: string;
  eventCount: number;
}

// POST /api/calendar/sync - Sync events from Google Calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Default to syncing current month if no range provided
    const now = new Date();
    const defaultTimeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultTimeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

    const timeMin = body.timeMin || defaultTimeMin;
    const timeMax = body.timeMax || defaultTimeMax;

    // Fetch events from Google Calendar
    const googleEvents = await fetchGoogleCalendarEvents(timeMin, timeMax);

    // Convert to our format
    const events: Partial<CalendarEvent>[] = googleEvents.map(fromGoogleEvent);

    const result: SyncResult = {
      success: true,
      events,
      syncedAt: new Date().toISOString(),
      eventCount: events.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to sync calendar:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync with Google Calendar',
        details: String(error),
        syncedAt: new Date().toISOString(),
        eventCount: 0,
        events: [],
      },
      { status: 500 }
    );
  }
}

// GET /api/calendar/sync - Get sync status
// Returns the last sync time and basic stats
export async function GET() {
  try {
    // In a real implementation, you'd store sync metadata in a database
    // For now, we just return a simple status
    return NextResponse.json({
      status: 'ready',
      message: 'Sync endpoint is operational. POST to trigger a sync.',
      lastSync: null, // Would be stored in DB
    });
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
