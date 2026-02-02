'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarEvent,
  CreateEventInput,
  EventType,
  User,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
} from '@/types/calendar';

interface EventFormProps {
  event?: Partial<CalendarEvent> | null;
  initialDate?: Date;
  onSubmit: (data: CreateEventInput) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  currentUser?: User;
}

export default function EventForm({
  event,
  initialDate,
  onSubmit,
  onDelete,
  onClose,
  isOpen,
  currentUser = 'meedo',
}: EventFormProps) {
  const isEditing = !!event?.google_event_id;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('hangout');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when event changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        setTitle(event.title || '');
        setDescription(event.description || '');
        setType(event.type || 'hangout');
        setLocation(event.location || '');
        setAllDay(event.all_day || false);

        if (event.start) {
          const start = new Date(event.start);
          setStartDate(formatDateForInput(start));
          setStartTime(formatTimeForInput(start));
        }
        if (event.end) {
          const end = new Date(event.end);
          setEndDate(formatDateForInput(end));
          setEndTime(formatTimeForInput(end));
        }
      } else if (initialDate) {
        // Creating new event
        setTitle('');
        setDescription('');
        setType('hangout');
        setLocation('');
        setAllDay(false);
        setStartDate(formatDateForInput(initialDate));
        setStartTime('18:00');
        setEndDate(formatDateForInput(initialDate));
        setEndTime('21:00');
      } else {
        // Default - today
        const today = new Date();
        setTitle('');
        setDescription('');
        setType('hangout');
        setLocation('');
        setAllDay(false);
        setStartDate(formatDateForInput(today));
        setStartTime('18:00');
        setEndDate(formatDateForInput(today));
        setEndTime('21:00');
      }
      setError(null);
    }
  }, [isOpen, event, initialDate]);

  // Auto-set end date when start date changes
  useEffect(() => {
    if (!isEditing && startDate && !endDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Build ISO datetime strings
      let start: string;
      let end: string;

      if (allDay) {
        start = startDate;
        end = endDate;
      } else {
        start = `${startDate}T${startTime}:00`;
        end = `${endDate}T${endTime}:00`;
      }

      const data: CreateEventInput = {
        title,
        description: description || undefined,
        type,
        start,
        end,
        all_day: allDay,
        location: location || undefined,
        created_by: currentUser,
      };

      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.google_event_id || !onDelete) return;

    const confirmed = window.confirm('delete this event? this cant be undone');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(event.google_event_id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get placeholder text based on event type
  const getTitlePlaceholder = () => {
    switch (type) {
      case 'mto': return 'e.g., work trip to NYC';
      case 'bto': return 'e.g., visiting family';
      case 'date': return 'e.g., dinner at fancy place';
      case 'special': return 'e.g., anniversary, birthday';
      default: return 'e.g., movie night';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'edit event' : 'new event'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((eventType) => (
                      <button
                        key={eventType}
                        type="button"
                        onClick={() => setType(eventType)}
                        className={`
                          px-3 py-1.5 text-sm rounded-full border transition-all
                          ${type === eventType
                            ? `${EVENT_TYPE_COLORS[eventType].bg} ${EVENT_TYPE_COLORS[eventType].text} ${EVENT_TYPE_COLORS[eventType].border} border-2`
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }
                        `}
                      >
                        {EVENT_TYPE_LABELS[eventType]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={getTitlePlaceholder()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-shadow"
                    required
                  />
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <label htmlFor="allDay" className="text-sm text-gray-700">
                    all day event
                  </label>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      start date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-shadow"
                      required
                    />
                  </div>
                  {!allDay && (
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                        start time
                      </label>
                      <input
                        type="time"
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-shadow"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      end date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-shadow"
                      required
                    />
                  </div>
                  {!allDay && (
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                        end time
                      </label>
                      <input
                        type="time"
                        id="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-shadow"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    location (optional)
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., meedo's place, beedo's, that one restaurant"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-shadow"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    notes (optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="any extra details..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-shadow resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {isEditing && onDelete && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'deleting...' : 'delete'}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? 'saving...'
                        : isEditing
                          ? 'save changes'
                          : 'create event'
                      }
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper functions
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTimeForInput(date: Date): string {
  return date.toTimeString().slice(0, 5);
}
