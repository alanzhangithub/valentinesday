// Google Calendar API Helpers for Meedobeedo
// Uses Google Calendar API v3

import { GoogleCalendarEvent, CalendarEvent, EventType } from '@/types/calendar';

// Environment variables for Google Calendar
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
const MEEDOBEEDO_CALENDAR_ID = process.env.MEEDOBEEDO_CALENDAR_ID || 'primary';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Get a fresh access token using the refresh token
 */
async function getAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Missing Google Calendar credentials in environment variables');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Make an authenticated request to Google Calendar API
 */
async function googleCalendarFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return response;
}

/**
 * Convert our event type to a description prefix for Google Calendar
 */
function eventTypeToPrefix(type: EventType): string {
  const prefixes: Record<EventType, string> = {
    hangout: '[HANGOUT]',
    mto: '[MTO]',
    bto: '[BTO]',
    date: '[DATE]',
    special: '[SPECIAL]',
  };
  return prefixes[type];
}

/**
 * Extract event type from Google Calendar event description
 */
function extractEventType(description?: string): EventType {
  if (!description) return 'hangout';

  if (description.includes('[MTO]')) return 'mto';
  if (description.includes('[BTO]')) return 'bto';
  if (description.includes('[DATE]')) return 'date';
  if (description.includes('[SPECIAL]')) return 'special';
  if (description.includes('[HANGOUT]')) return 'hangout';

  return 'hangout';
}

/**
 * Convert a CalendarEvent to Google Calendar format
 */
export function toGoogleEvent(event: Partial<CalendarEvent>): Partial<GoogleCalendarEvent> {
  const description = event.type
    ? `${eventTypeToPrefix(event.type)} ${event.description || ''}`.trim()
    : event.description;

  const googleEvent: Partial<GoogleCalendarEvent> = {
    summary: event.title,
    description,
    location: event.location,
  };

  if (event.all_day) {
    // All-day events use date instead of dateTime
    googleEvent.start = { date: event.start?.split('T')[0] };
    googleEvent.end = { date: event.end?.split('T')[0] };
  } else {
    googleEvent.start = { dateTime: event.start, timeZone: 'America/Los_Angeles' };
    googleEvent.end = { dateTime: event.end, timeZone: 'America/Los_Angeles' };
  }

  if (event.recurrence_rule) {
    googleEvent.recurrence = [event.recurrence_rule];
  }

  return googleEvent;
}

/**
 * Convert a Google Calendar event to our CalendarEvent format
 */
export function fromGoogleEvent(googleEvent: GoogleCalendarEvent): Partial<CalendarEvent> {
  const type = extractEventType(googleEvent.description);

  // Clean the description by removing the type prefix
  let description = googleEvent.description || '';
  Object.values(['[MTO]', '[BTO]', '[DATE]', '[SPECIAL]', '[HANGOUT]']).forEach(prefix => {
    description = description.replace(prefix, '').trim();
  });

  return {
    google_event_id: googleEvent.id,
    title: googleEvent.summary,
    description: description || undefined,
    type,
    start: googleEvent.start.dateTime || googleEvent.start.date || '',
    end: googleEvent.end.dateTime || googleEvent.end.date || '',
    all_day: !googleEvent.start.dateTime,
    location: googleEvent.location,
    recurring: !!googleEvent.recurrence?.length,
  };
}

/**
 * Fetch events from Google Calendar within a date range
 */
export async function fetchGoogleCalendarEvents(
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const response = await googleCalendarFetch(
    `/calendars/${encodeURIComponent(MEEDOBEEDO_CALENDAR_ID)}/events?${params}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch events: ${error}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a new event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  event: Partial<CalendarEvent>
): Promise<GoogleCalendarEvent> {
  const googleEvent = toGoogleEvent(event);

  const response = await googleCalendarFetch(
    `/calendars/${encodeURIComponent(MEEDOBEEDO_CALENDAR_ID)}/events`,
    {
      method: 'POST',
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create event: ${error}`);
  }

  return response.json();
}

/**
 * Update an existing event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<GoogleCalendarEvent> {
  const googleEvent = toGoogleEvent(event);

  const response = await googleCalendarFetch(
    `/calendars/${encodeURIComponent(MEEDOBEEDO_CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update event: ${error}`);
  }

  return response.json();
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  const response = await googleCalendarFetch(
    `/calendars/${encodeURIComponent(MEEDOBEEDO_CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete event: ${error}`);
  }
}

/**
 * Get a single event from Google Calendar
 */
export async function getGoogleCalendarEvent(eventId: string): Promise<GoogleCalendarEvent | null> {
  const response = await googleCalendarFetch(
    `/calendars/${encodeURIComponent(MEEDOBEEDO_CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get event: ${error}`);
  }

  return response.json();
}
