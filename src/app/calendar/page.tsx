'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import StampTray from '@/components/calendar/StampTray';
import StampPill from '@/components/calendar/StampPill';
import CreateStampForm from '@/components/calendar/CreateStampForm';
import DayDetail from '@/components/calendar/DayDetail';
import type { Stamp, DayStamp } from '@/types/calendar';
import { formatDateKey } from '@/types/calendar';

export default function CalendarPage() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [dayStamps, setDayStamps] = useState<DayStamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Drag state
  const [activeStamp, setActiveStamp] = useState<Stamp | null>(null);

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailDate, setDetailDate] = useState<string | null>(null);

  // Track fetched range
  const fetchedRangeRef = useRef<{ from: string; to: string } | null>(null);

  // TODO: get from auth
  const currentUser = 'meedo' as 'meedo' | 'beedo';

  // Sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Fetch stamps
  const fetchStamps = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/stamps');
      const json = await res.json();
      if (json.success) setStamps(json.data);
    } catch (err) {
      console.error('failed to fetch stamps:', err);
    }
  }, []);

  // Fetch day stamps for a month range
  const fetchDayStamps = useCallback(async (monthDate: Date, force = false) => {
    const from = formatDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
    const to = formatDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 2, 0));

    if (!force && fetchedRangeRef.current) {
      const { from: prevFrom, to: prevTo } = fetchedRangeRef.current;
      if (from >= prevFrom && to <= prevTo) return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/days?from=${from}&to=${to}`);
      const json = await res.json();
      if (json.success) {
        setDayStamps(json.data);
        fetchedRangeRef.current = { from, to };
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load stamps');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStamps();
    fetchDayStamps(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Month change
  const handleMonthChange = useCallback((date: Date) => {
    setCurrentMonth(date);
    fetchDayStamps(date);
  }, [fetchDayStamps]);

  // Place stamp
  const handlePlaceStamp = useCallback(async (stampId: string, date: string) => {
    try {
      const res = await fetch('/api/calendar/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stamp_id: stampId, date, placed_by: currentUser }),
      });
      const json = await res.json();
      if (json.success) {
        setDayStamps((prev) => [...prev, json.data]);
      } else if (res.status === 409) {
        // already placed, ignore
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to place stamp');
    }
  }, [currentUser]);

  // Remove stamp
  const handleRemoveStamp = useCallback(async (dayStampId: string) => {
    try {
      const res = await fetch(`/api/calendar/days/${dayStampId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDayStamps((prev) => prev.filter((ds) => ds.id !== dayStampId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to remove stamp');
    }
  }, []);

  // Create stamp
  const handleCreateStamp = useCallback(async (data: { name: string; emoji: string; color: string }) => {
    const res = await fetch('/api/calendar/stamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, created_by: currentUser }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setStamps((prev) => [...prev, json.data]);
  }, [currentUser]);

  // Delete stamp
  const handleDeleteStamp = useCallback(async (stampId: string) => {
    try {
      const res = await fetch(`/api/calendar/stamps/${stampId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setStamps((prev) => prev.filter((s) => s.id !== stampId));
        setDayStamps((prev) => prev.filter((ds) => ds.stamp_id !== stampId));
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to delete stamp');
    }
  }, []);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const stamp = event.active.data.current?.stamp as Stamp | undefined;
    if (stamp) setActiveStamp(stamp);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveStamp(null);
    const { active, over } = event;
    if (!over) return;

    const stamp = active.data.current?.stamp as Stamp | undefined;
    const date = over.data.current?.date as string | undefined;
    if (stamp && date) {
      handlePlaceStamp(stamp.id, date);
    }
  };

  // Day click
  const handleDayClick = (date: Date) => {
    setDetailDate(formatDateKey(date));
  };

  const detailDayStamps = detailDate
    ? dayStamps.filter((ds) => ds.date === detailDate)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b-2 border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-heading font-semibold text-foreground">our calendar</h1>
          <p className="text-muted-foreground font-body mt-1">stamp your days</p>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm font-body flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <CalendarGrid
            currentDate={currentMonth}
            dayStamps={dayStamps}
            onDayClick={handleDayClick}
            onMonthChange={handleMonthChange}
            isLoading={isLoading}
          />

          <div className="mt-4 rounded-2xl border-2 border-border overflow-hidden">
            <StampTray stamps={stamps} onCreateStamp={() => setIsCreateOpen(true)} onDeleteStamp={handleDeleteStamp} />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeStamp && <StampPill stamp={activeStamp} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      <CreateStampForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateStamp}
      />

      <DayDetail
        date={detailDate || ''}
        dayStamps={detailDayStamps}
        isOpen={!!detailDate}
        onClose={() => setDetailDate(null)}
        onRemoveStamp={handleRemoveStamp}
      />
    </div>
  );
}
