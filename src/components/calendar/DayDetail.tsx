'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { DayStamp } from '@/types/calendar';
import StampPill from './StampPill';

interface DayDetailProps {
  date: string;
  dayStamps: DayStamp[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveStamp: (dayStampId: string) => void;
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function DayDetail({ date, dayStamps, isOpen, onClose, onRemoveStamp }: DayDetailProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[20%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xs z-50"
          >
            <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {formatDisplayDate(date)}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                {dayStamps.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">no stamps yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dayStamps.map((ds) => (
                      <StampPill
                        key={ds.id}
                        stamp={ds.stamp}
                        onRemove={() => onRemoveStamp(ds.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
