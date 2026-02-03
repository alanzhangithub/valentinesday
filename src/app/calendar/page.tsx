'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import CalendarView from '@/components/calendar/CalendarView';
import EventForm from '@/components/calendar/EventForm';
import { CalendarEvent, CreateEventInput, User } from '@/types/calendar';

export default function CalendarPage() {
  const [events, setEvents] = useState<Partial<CalendarEvent>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // track what range we've already fetched to avoid re-fetching
  const fetchedRangeRef = useRef<{ min: string; max: string } | null>(null);

  // TODO: get actual user from auth context
  const currentUser: User = 'meedo';

  // Fetch events for a given month + buffer
  const fetchEvents = useCallback(async (monthDate: Date, force = false) => {
    // Get 3 months range (prev month to next month)
    const timeMin = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(monthDate.getFullYear(), monthDate.getMonth() + 2, 0).toISOString();

    // skip if we already fetched this range (unless forced)
    if (!force && fetchedRangeRef.current) {
      const { min, max } = fetchedRangeRef.current;
      if (timeMin >= min && timeMax <= max) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/calendar?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
      );

      if (!response.ok) {
        throw new Error('failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
      fetchedRangeRef.current = { min: timeMin, max: timeMax };
    } catch (err) {
      console.error('fetch error:', err);
      setError(err instanceof Error ? err.message : 'something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // initial fetch on mount
  useEffect(() => {
    fetchEvents(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle month change from calendar
  const handleMonthChange = useCallback((date: Date) => {
    setCurrentMonth(date);
    fetchEvents(date);
  }, [fetchEvents]);

  // Handle event click (open edit form)
  const handleEventClick = (event: Partial<CalendarEvent>) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setIsFormOpen(true);
  };

  // Handle date click (open create form for that date)
  const handleDateClick = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setIsFormOpen(true);
  };

  // Handle add event button
  const handleAddEvent = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setIsFormOpen(true);
  };

  // Close the form modal
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEvent(null);
    setSelectedDate(undefined);
  };

  // Create or update event
  const handleSubmit = async (data: CreateEventInput) => {
    if (selectedEvent?.google_event_id) {
      // Update existing event
      const response = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEvent.google_event_id,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'failed to update event');
      }
    } else {
      // Create new event
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'failed to create event');
      }
    }

    // Refresh events after mutation (force refetch)
    await fetchEvents(currentMonth, true);
  };

  // Delete event
  const handleDelete = async (eventId: string) => {
    const response = await fetch(`/api/calendar?id=${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'failed to delete event');
    }

    // Refresh events after deletion (force refetch)
    await fetchEvents(currentMonth, true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">our calendar</h1>
              <p className="text-gray-500 mt-1">
                keeping track of hangouts, dates, and time off
              </p>
            </div>
            <button
              onClick={() => handleAddEvent(new Date())}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              new event
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">oops</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchEvents(currentMonth, true)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              try again
            </button>
          </div>
        )}

        <CalendarView
          events={events}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onAddEvent={handleAddEvent}
          onMonthChange={handleMonthChange}
          isLoading={isLoading}
        />
      </div>

      {/* Event Form Modal */}
      <EventForm
        event={selectedEvent}
        initialDate={selectedDate}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onClose={handleCloseForm}
        isOpen={isFormOpen}
        currentUser={currentUser}
      />
    </div>
  );
}
