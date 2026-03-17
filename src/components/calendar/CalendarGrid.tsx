'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DayStamp } from '@/types/calendar';
import { formatDateKey } from '@/types/calendar';
import DroppableDay from './DroppableDay';

interface CalendarGridProps {
  currentDate: Date;
  dayStamps: DayStamp[];
  onDayClick: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarGrid({
  currentDate,
  dayStamps,
  onDayClick,
  onMonthChange,
  isLoading = false,
}: CalendarGridProps) {
  const days = useMemo(() => getMonthDays(currentDate), [currentDate]);

  const stampsByDate = useMemo(() => {
    const grouped: Record<string, DayStamp[]> = {};
    dayStamps.forEach((ds) => {
      if (!grouped[ds.date]) grouped[ds.date] = [];
      grouped[ds.date].push(ds);
    });
    return grouped;
  }, [dayStamps]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const goToToday = () => onMonthChange(new Date());

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-xs font-body font-semibold border-2 border-border rounded-full hover:bg-muted transition-colors"
          >
            today
          </button>
        </div>

        <div className="flex gap-1">
          <button
            onClick={navigatePrev}
            className="p-2 border-2 border-border rounded-full hover:bg-muted transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={navigateNext}
            className="p-2 border-2 border-border rounded-full hover:bg-muted transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="relative border-2 border-border rounded-2xl overflow-hidden bg-card shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 bg-card/70 flex items-center justify-center z-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary" />
              <span className="text-sm text-muted-foreground font-body">loading stamps...</span>
            </div>
          </div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted/50 border-b-2 border-border">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-[11px] font-heading font-semibold text-muted-foreground uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          <AnimatePresence mode="wait">
            {days.map((date, index) => {
              const dateKey = formatDateKey(date);
              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1, delay: index * 0.005 }}
                >
                  <DroppableDay
                    date={date}
                    dayStamps={stampsByDate[dateKey] || []}
                    isCurrentMonth={isCurrentMonth(date)}
                    isToday={isToday(date)}
                    onDayClick={onDayClick}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

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
