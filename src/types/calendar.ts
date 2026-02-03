// Calendar Types for Meedobeedo

export type EventType = 'hangout' | 'mto' | 'bto' | 'date' | 'special';
export type User = 'meedo' | 'beedo';

export interface CalendarEvent {
  id: string;
  google_event_id?: string;
  title: string;
  description?: string;
  type: EventType;
  start: string; // ISO datetime
  end: string; // ISO datetime
  all_day?: boolean;
  location?: string;
  created_by: User;
  created_at: string;
  updated_at: string;
  // For recurring events
  recurring?: boolean;
  recurrence_rule?: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  type: EventType;
  start: string;
  end: string;
  all_day?: boolean;
  location?: string;
  created_by: User;
  recurring?: boolean;
  recurrence_rule?: string;
}

export interface UpdateEventInput {
  id: string;
  title?: string;
  description?: string;
  type?: EventType;
  start?: string;
  end?: string;
  all_day?: boolean;
  location?: string;
}

// Google Calendar types
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  status?: string;
}

// View types
export type CalendarViewType = 'month' | 'week';

// Regular schedule - Tues/Sat at Meedo's, Wed/Fri at Beedo's, Sun day dates
export const REGULAR_SCHEDULE = {
  tuesday: { location: "meedo's", type: 'hangout' as EventType },
  wednesday: { location: "beedo's", type: 'hangout' as EventType },
  friday: { location: "beedo's", type: 'hangout' as EventType },
  saturday: { location: "meedo's", type: 'hangout' as EventType },
  sunday: { location: 'day date', type: 'date' as EventType },
} as const;

// Event type colors for display
export const EVENT_TYPE_COLORS: Record<EventType, { bg: string; text: string; border: string }> = {
  hangout: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  mto: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  bto: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  date: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  special: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
};

// Event type labels with cute names
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  hangout: 'Hangout',
  mto: 'Meedo Time Off',
  bto: 'Beedo Time Off',
  date: 'Date Night',
  special: 'Special Event',
};
