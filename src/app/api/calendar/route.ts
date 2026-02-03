// Calendar API Routes - CRUD for events
// POST: Create event
// GET: List events (with date range)
// PUT: Update event
// DELETE: Delete event

import { NextRequest, NextResponse } from 'next/server';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  fetchGoogleCalendarEvents,
  fromGoogleEvent,
} from '@/lib/google-calendar';
import { CreateEventInput, UpdateEventInput, CalendarEvent } from '@/types/calendar';

// GET /api/calendar - List events
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: 'timeMin and timeMax query parameters are required' },
        { status: 400 }
      );
    }

    const googleEvents = await fetchGoogleCalendarEvents(timeMin, timeMax);

    // Convert Google events to our format
    const events: Partial<CalendarEvent>[] = googleEvents.map(fromGoogleEvent);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/calendar - Create event
export async function POST(request: NextRequest) {
  try {
    const body: CreateEventInput = await request.json();

    // Validate required fields
    if (!body.title || !body.start || !body.end || !body.type || !body.created_by) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start, end, type, created_by' },
        { status: 400 }
      );
    }

    // Create in Google Calendar
    const googleEvent = await createGoogleCalendarEvent({
      title: body.title,
      description: body.description,
      type: body.type,
      start: body.start,
      end: body.end,
      all_day: body.all_day,
      location: body.location,
      recurring: body.recurring,
      recurrence_rule: body.recurrence_rule,
    });

    // Return the created event in our format
    const event: Partial<CalendarEvent> = {
      ...fromGoogleEvent(googleEvent),
      created_by: body.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/calendar - Update event
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateEventInput = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Update in Google Calendar
    const googleEvent = await updateGoogleCalendarEvent(body.id, {
      title: body.title,
      description: body.description,
      type: body.type,
      start: body.start,
      end: body.end,
      all_day: body.all_day,
      location: body.location,
    });

    // Return the updated event in our format
    const event = fromGoogleEvent(googleEvent);

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await deleteGoogleCalendarEvent(eventId);

    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: String(error) },
      { status: 500 }
    );
  }
}
