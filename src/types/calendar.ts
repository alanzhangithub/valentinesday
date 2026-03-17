// Calendar Stamp System Types

import type { UserRole } from '@/types/database';

export type CalendarViewType = 'month' | 'week';

// Stamp definition (what stamps exist)
export interface Stamp {
  id: string;
  name: string;
  emoji: string;
  color: string; // hex code e.g. '#3b82f6'
  created_by: UserRole;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

// A stamp placed on a specific day (with joined stamp data)
export interface DayStamp {
  id: string;
  stamp_id: string;
  date: string; // YYYY-MM-DD
  placed_by: UserRole;
  placed_at: string;
  stamp: Stamp; // joined from stamps table
}

// API input types
export interface CreateStampInput {
  name: string;
  emoji: string;
  color: string;
}

export interface UpdateStampInput {
  name?: string;
  emoji?: string;
  color?: string;
}

export interface PlaceStampInput {
  stamp_id: string;
  date: string; // YYYY-MM-DD
}

// Date formatting utility
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Color palette for stamp creation
export const STAMP_COLORS = [
  { name: 'blue', hex: '#3b82f6' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'green', hex: '#10b981' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'red', hex: '#ef4444' },
  { name: 'purple', hex: '#8b5cf6' },
  { name: 'orange', hex: '#f97316' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'indigo', hex: '#6366f1' },
  { name: 'rose', hex: '#f43f5e' },
] as const;
