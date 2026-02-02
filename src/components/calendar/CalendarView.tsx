'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarEvent,
  CalendarViewType,
  EventType,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  REGULAR_SCHEDULE,
} from '@/types/calendar';

interface CalendarViewProps {
  events: Partial<CalendarEvent>[];
  onEventClick?: (event: Partial<CalendarEvent>) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarView({
  events,
  onEventClick,
  onDateClick,
  onAddEvent,
  isLoading = false,
}: CalendarViewProps) {
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the days to display based on view type
  const days = useMemo(() => {
    if (viewType === 'month') {
      return getMonthDays(currentDate);
    } else {
      return getWeekDays(currentDate);
    }
  }, [currentDate, viewType]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Partial<CalendarEvent>[]> = {};
    events.forEach(event => {
      if (event.start) {
        const dateKey = event.start.split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      }
    });
    return grouped;
  }, [events]);

  // Navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if a date is in the current month (for month view)
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Get regular schedule indicator for a date
  const getRegularScheduleForDate = (date: Date): string | null => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()] as keyof typeof REGULAR_SCHEDULE;
    const schedule = REGULAR_SCHEDULE[dayName];
    return schedule?.location || null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1 text-sm transition-colors ${
                viewType === 'month'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-3 py-1 text-sm transition-colors ${
                viewType === 'week'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
          </div>

          {/* Navigation */}
          <div className="flex gap-1">
            <button
              onClick={navigatePrev}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              aria-label="Previous"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateNext}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              aria-label="Next"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        {(Object.keys(EVENT_TYPE_COLORS) as EventType[]).map(type => (
          <div key={type} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${EVENT_TYPE_COLORS[type].bg} ${EVENT_TYPE_COLORS[type].border} border`} />
            <span className="text-gray-600">{EVENT_TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900" />
        </div>
      )}

      {/* Calendar Grid */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={`grid grid-cols-7 ${viewType === 'month' ? 'min-h-[500px]' : 'min-h-[200px]'}`}>
          <AnimatePresence mode="wait">
            {days.map((date, index) => {
              const dateKey = date.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dateKey] || [];
              const regularSchedule = getRegularScheduleForDate(date);

              return (
                <motion.div
                  key={`${dateKey}-${viewType}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.01 }}
                  className={`
                    border-b border-r border-gray-100 p-1
                    ${viewType === 'month' ? 'min-h-[100px]' : 'min-h-[150px]'}
                    ${!isCurrentMonth(date) && viewType === 'month' ? 'bg-gray-50' : 'bg-white'}
                    ${isToday(date) ? 'bg-blue-50' : ''}
                    hover:bg-gray-50 cursor-pointer transition-colors
                  `}
                  onClick={() => onDateClick?.(date)}
                >
                  {/* Date Number */}
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className={`
                        inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                        ${isToday(date)
                          ? 'bg-gray-900 text-white font-bold'
                          : !isCurrentMonth(date) && viewType === 'month'
                            ? 'text-gray-400'
                            : 'text-gray-700'
                        }
                      `}
                    >
                      {date.getDate()}
                    </span>

                    {/* Add Event Button */}
                    {onAddEvent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddEvent(date);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
                        aria-label="Add event"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Regular Schedule Indicator */}
                  {regularSchedule && dayEvents.length === 0 && (
                    <div className="text-xs text-gray-400 italic mb-1 truncate">
                      {regularSchedule}
                    </div>
                  )}

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, viewType === 'month' ? 3 : 10).map((event, eventIndex) => (
                      <motion.div
                        key={event.google_event_id || eventIndex}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: eventIndex * 0.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className={`
                          px-1.5 py-0.5 text-xs rounded truncate cursor-pointer
                          ${EVENT_TYPE_COLORS[event.type || 'hangout'].bg}
                          ${EVENT_TYPE_COLORS[event.type || 'hangout'].text}
                          ${EVENT_TYPE_COLORS[event.type || 'hangout'].border}
                          border hover:brightness-95 transition-all
                        `}
                      >
                        {event.title}
                      </motion.div>
                    ))}

                    {/* More Events Indicator */}
                    {viewType === 'month' && dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Helper: Get all days for a month view (including padding days)
function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);

  // Start from the Sunday of the week containing the first day
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // End on the Saturday of the week containing the last day
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

// Helper: Get all days for a week view
function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    days.push(day);
  }

  return days;
}
