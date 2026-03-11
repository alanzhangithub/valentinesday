# Calendar Stamp System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the event-based calendar with a drag-and-drop stamp system backed by Supabase.

**Architecture:** Bottom tray of draggable stamp pills + month/week calendar grid as drop targets. Stamps are day markers (no times) that stack on days. @dnd-kit handles drag-and-drop with touch support for iPad. Supabase stores stamp definitions and placements.

**Tech Stack:** Next.js 15, @dnd-kit/core, Supabase, Framer Motion, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-11-calendar-stamps-design.md`

---

## File Structure

```
src/
├── types/
│   ├── calendar.ts          (REWRITE - stamp types replace event types)
│   └── database.ts          (MODIFY - add Stamp/DayStamp table types)
├── app/
│   ├── calendar/
│   │   └── page.tsx          (REWRITE - stamp-based calendar page)
│   └── api/calendar/
│       ├── route.ts          (DELETE - old Google Calendar CRUD)
│       ├── sync/route.ts     (DELETE - old Google Calendar sync)
│       ├── stamps/
│       │   ├── route.ts      (CREATE - GET all stamps, POST new stamp)
│       │   └── [id]/
│       │       └── route.ts  (CREATE - PUT update, DELETE stamp)
│       └── days/
│           ├── route.ts      (CREATE - GET placements by range, POST place stamp)
│           └── [id]/
│               └── route.ts  (CREATE - DELETE remove placement)
├── components/calendar/
│   ├── CalendarView.tsx      (DELETE - replaced by CalendarGrid)
│   ├── EventForm.tsx         (DELETE - replaced by stamp system)
│   ├── CalendarGrid.tsx      (CREATE - month/week grid with droppable day cells)
│   ├── StampPill.tsx         (CREATE - reusable stamp pill component)
│   ├── StampTray.tsx         (CREATE - bottom draggable stamp tray)
│   ├── DayDetail.tsx         (CREATE - popover for viewing/removing stamps on a day)
│   ├── CreateStampForm.tsx   (CREATE - modal for creating new stamps)
│   └── StampManager.tsx      (CREATE - settings view for editing/deleting stamps)
└── lib/
    ├── google-calendar.ts    (DELETE - no longer needed)
    └── schema.sql            (MODIFY - add stamps + day_stamps tables)
```

---

## Chunk 1: Foundation

### Task 1: Install @dnd-kit

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @dnd-kit packages**

Run: `cd /home/alanzhang/valentinesday && bun add @dnd-kit/core @dnd-kit/utilities`

- [ ] **Step 2: Verify installation**

Run: `cd /home/alanzhang/valentinesday && bun pm ls | grep dnd-kit`
Expected: `@dnd-kit/core` and `@dnd-kit/utilities` listed

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "feat(calendar): add @dnd-kit for drag-and-drop stamp system"
```

---

### Task 2: Database schema

**Files:**
- Modify: `src/lib/schema.sql`

- [ ] **Step 1: Add stamps and day_stamps tables to schema.sql**

Append after the existing tables (after the `events` section):

```sql
-- ============================================
-- STAMPS (Calendar stamp system)
-- ============================================

CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  created_by user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE day_stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stamp_id UUID NOT NULL REFERENCES stamps(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  placed_by user_role NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stamp_id, date)
);

CREATE INDEX idx_day_stamps_date ON day_stamps(date);

-- Trigger for stamps updated_at
CREATE TRIGGER update_stamps_updated_at
  BEFORE UPDATE ON stamps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed default stamps
INSERT INTO stamps (name, emoji, color, created_by, is_default) VALUES
  ('meedo''s', '🏠', '#3b82f6', 'meedo', true),
  ('beedo''s', '🏠', '#ec4899', 'beedo', true),
  ('pickleball', '🏓', '#10b981', 'meedo', true),
  ('mex', '🔥', '#f59e0b', 'meedo', true);
```

- [ ] **Step 2: Run the SQL in Supabase**

Go to Supabase dashboard → SQL Editor → paste and run the stamps/day_stamps DDL + seed.

Note: The `update_updated_at()` function already exists from the events/boards tables. If running fresh, ensure that function exists first.

- [ ] **Step 3: Commit**

```bash
git add src/lib/schema.sql
git commit -m "feat(calendar): add stamps and day_stamps tables with seed data"
```

---

### Task 3: TypeScript types

**Files:**
- Rewrite: `src/types/calendar.ts`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Rewrite `src/types/calendar.ts`**

Replace entire file contents with:

```typescript
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
```

- [ ] **Step 2: Add Stamp and DayStamp types to `src/types/database.ts`**

Add after the existing `Event` interface (~line 76):

```typescript
export interface Stamp {
  id: string;
  name: string;
  emoji: string;
  color: string;
  created_by: UserRole;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

export interface DayStamp {
  id: string;
  stamp_id: string;
  date: string;
  placed_by: UserRole;
  placed_at: string;
}
```

Add insert/update types after the existing insert types (~line 196):

```typescript
export type StampInsert = Omit<Stamp, 'id' | 'created_at' | 'updated_at' | 'is_default'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
};

export type DayStampInsert = Omit<DayStamp, 'id' | 'placed_at'> & {
  id?: string;
  placed_at?: string;
};
```

Add update types after the existing update types (~line 267):

```typescript
export type StampUpdate = Partial<Omit<Stamp, 'id' | 'created_at'>>;
export type DayStampUpdate = never; // placements are immutable — delete and re-create

// For day_stamps with joined stamp data (from select('*, stamp:stamps(*)'))
export interface DayStampWithStamp extends DayStamp {
  stamp: Stamp;
}
```

Add table entries to the `Database` interface `Tables` section (~line 345):

```typescript
stamps: {
  Row: Stamp;
  Insert: StampInsert;
  Update: StampUpdate;
};
day_stamps: {
  Row: DayStamp;
  Insert: DayStampInsert;
  Update: DayStampUpdate;
};
```

- [ ] **Step 3: Commit**

```bash
git add src/types/calendar.ts src/types/database.ts
git commit -m "feat(calendar): add stamp type definitions"
```

---

## Chunk 2: API Routes

### Task 4: Stamps CRUD API

**Files:**
- Create: `src/app/api/calendar/stamps/route.ts`
- Create: `src/app/api/calendar/stamps/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/calendar/stamps/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse, Stamp } from '@/types/database';

// GET /api/calendar/stamps - List all stamp definitions
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('stamps')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json<ApiResponse<Stamp[]>>({
      data: data || [],
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to fetch stamps',
      success: false,
    }, { status: 500 });
  }
}

// POST /api/calendar/stamps - Create a new stamp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, emoji, color, created_by } = body;

    if (!name || !emoji || !color || !created_by) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'missing required fields: name, emoji, color, created_by',
        success: false,
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('stamps')
      .insert({ name, emoji, color, created_by })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Stamp>>({
      data,
      error: null,
      success: true,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to create stamp',
      success: false,
    }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/calendar/stamps/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse, Stamp } from '@/types/database';

// PUT /api/calendar/stamps/[id] - Update stamp definition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, emoji, color } = body;

    const updates: Record<string, string> = {};
    if (name) updates.name = name;
    if (emoji) updates.emoji = emoji;
    if (color) updates.color = color;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'no fields to update',
        success: false,
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('stamps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Stamp>>({
      data,
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to update stamp',
      success: false,
    }, { status: 500 });
  }
}

// DELETE /api/calendar/stamps/[id] - Delete stamp (cascades to placements)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('stamps')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to delete stamp',
      success: false,
    }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify API routes compile**

Run: `cd /home/alanzhang/valentinesday && bunx tsc --noEmit --pretty 2>&1 | grep -E "(stamps/route|stamps/\[id\])" | head -20`
Expected: No errors related to stamp route files (some other existing errors are OK)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/calendar/stamps/
git commit -m "feat(calendar): add stamps CRUD API routes"
```

---

### Task 5: Day stamps API

**Files:**
- Create: `src/app/api/calendar/days/route.ts`
- Create: `src/app/api/calendar/days/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/calendar/days/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse, DayStampWithStamp } from '@/types/database';

// GET /api/calendar/days?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'from and to query parameters are required (YYYY-MM-DD)',
        success: false,
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('day_stamps')
      .select('*, stamp:stamps(*)')
      .gte('date', from)
      .lte('date', to)
      .order('placed_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json<ApiResponse<DayStampWithStamp[]>>({
      data: (data || []) as DayStampWithStamp[],
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to fetch day stamps',
      success: false,
    }, { status: 500 });
  }
}

// POST /api/calendar/days - Place a stamp on a day
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stamp_id, date, placed_by } = body;

    if (!stamp_id || !date || !placed_by) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'missing required fields: stamp_id, date, placed_by',
        success: false,
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('day_stamps')
      .insert({ stamp_id, date, placed_by })
      .select('*, stamp:stamps(*)')
      .single();

    if (error) {
      // Handle unique constraint violation (stamp already on this day)
      if (error.code === '23505') {
        return NextResponse.json<ApiResponse<null>>({
          data: null,
          error: 'this stamp is already on this day',
          success: false,
        }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json<ApiResponse<DayStampWithStamp>>({
      data: data as DayStampWithStamp,
      error: null,
      success: true,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to place stamp',
      success: false,
    }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/calendar/days/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse } from '@/types/database';

// DELETE /api/calendar/days/[id] - Remove a stamp from a day
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('day_stamps')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'failed to remove stamp',
      success: false,
    }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/calendar/days/
git commit -m "feat(calendar): add day stamps API routes (place/remove/list)"
```

---

## Chunk 3: UI Components

### Task 6: StampPill component

**Files:**
- Create: `src/components/calendar/StampPill.tsx`

- [ ] **Step 1: Create `src/components/calendar/StampPill.tsx`**

This is the reusable pill that appears in the calendar grid, the tray, and the day detail popover.

```tsx
'use client';

import type { Stamp } from '@/types/calendar';

interface StampPillProps {
  stamp: Stamp;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  className?: string;
}

export default function StampPill({ stamp, size = 'sm', onRemove, className = '' }: StampPillProps) {
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
    : 'text-sm px-3 py-1.5 gap-1.5';

  return (
    <div
      className={`
        inline-flex items-center rounded-md font-medium
        whitespace-nowrap overflow-hidden
        ${sizeClasses} ${className}
      `}
      style={{
        backgroundColor: `${stamp.color}20`,
        color: stamp.color,
        border: `1px solid ${stamp.color}40`,
      }}
    >
      <span>{stamp.emoji}</span>
      <span className="truncate">{stamp.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 flex-shrink-0"
          aria-label={`Remove ${stamp.name}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/calendar/StampPill.tsx
git commit -m "feat(calendar): add StampPill component"
```

---

### Task 7: StampTray component

**Files:**
- Create: `src/components/calendar/StampTray.tsx`

- [ ] **Step 1: Create `src/components/calendar/StampTray.tsx`**

The bottom tray with draggable stamps. Each stamp is wrapped in a `useDraggable` from @dnd-kit.

```tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Stamp } from '@/types/calendar';

interface StampTrayProps {
  stamps: Stamp[];
  onCreateNew: () => void;
  onManage: () => void;
}

function DraggableStamp({ stamp }: { stamp: Stamp }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `stamp-${stamp.id}`,
    data: { stamp },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    backgroundColor: `${stamp.color}20`,
    color: stamp.color,
    borderColor: `${stamp.color}60`,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-2 rounded-xl px-3 py-2 text-sm font-medium cursor-grab active:cursor-grabbing
                 whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 select-none"
      {...listeners}
      {...attributes}
    >
      <span>{stamp.emoji}</span>
      <span>{stamp.name}</span>
    </div>
  );
}

export default function StampTray({ stamps, onCreateNew, onManage }: StampTrayProps) {
  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onManage}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Manage stamps"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {stamps.map((stamp) => (
            <DraggableStamp key={stamp.id} stamp={stamp} />
          ))}
          <button
            onClick={onCreateNew}
            className="border-2 border-dashed border-gray-300 rounded-xl px-3 py-2 text-sm
                       text-gray-400 whitespace-nowrap flex-shrink-0 hover:border-gray-400
                       hover:text-gray-500 transition-colors"
          >
            + new stamp
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/calendar/StampTray.tsx
git commit -m "feat(calendar): add StampTray with draggable stamps"
```

---

### Task 8: CreateStampForm component

**Files:**
- Create: `src/components/calendar/CreateStampForm.tsx`

- [ ] **Step 1: Create `src/components/calendar/CreateStampForm.tsx`**

Modal for creating a new stamp with name, emoji, and color picker.

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STAMP_COLORS } from '@/types/calendar';

interface CreateStampFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; emoji: string; color: string }) => Promise<void>;
}

const COMMON_EMOJIS = ['🏠', '🏓', '🔥', '🎮', '🍕', '🎬', '💪', '🛒', '✈️', '🎂', '❤️', '⭐', '🎯', '🧘', '📚', '🎵'];

export default function CreateStampForm({ isOpen, onClose, onSubmit }: CreateStampFormProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [color, setColor] = useState(STAMP_COLORS[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), emoji, color });
      setName('');
      setEmoji('⭐');
      setColor(STAMP_COLORS[0].hex);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to create stamp');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50"
          >
            <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">new stamp</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}

                {/* Preview */}
                <div className="flex justify-center">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-base font-medium border-2"
                    style={{
                      backgroundColor: `${color}20`,
                      color: color,
                      borderColor: `${color}60`,
                    }}
                  >
                    <span>{emoji}</span>
                    <span>{name || 'stamp name'}</span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="stamp-name" className="block text-sm font-medium text-gray-700 mb-1">name</label>
                  <input
                    type="text"
                    id="stamp-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. gym, movie night"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    required
                    maxLength={20}
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all
                          ${emoji === e ? 'bg-gray-900 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">color</label>
                  <div className="flex flex-wrap gap-2">
                    {STAMP_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        className={`w-10 h-10 rounded-full transition-all border-2
                          ${color === c.hex ? 'scale-110 border-gray-900' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'creating...' : 'create'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/calendar/CreateStampForm.tsx
git commit -m "feat(calendar): add CreateStampForm modal"
```

---

### Task 9: StampManager component

**Files:**
- Create: `src/components/calendar/StampManager.tsx`

- [ ] **Step 1: Create `src/components/calendar/StampManager.tsx`**

Settings view for editing and deleting stamp definitions. Opened via gear icon in the stamp tray.

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STAMP_COLORS } from '@/types/calendar';
import type { Stamp } from '@/types/calendar';

interface StampManagerProps {
  isOpen: boolean;
  stamps: Stamp[];
  onClose: () => void;
  onUpdate: (id: string, data: { name?: string; emoji?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function StampRow({
  stamp,
  onUpdate,
  onDelete,
}: {
  stamp: Stamp;
  onUpdate: (data: { name?: string; emoji?: string; color?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(stamp.name);
  const [color, setColor] = useState(stamp.color);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onUpdate({ name: name.trim(), color });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`delete "${stamp.emoji} ${stamp.name}"? this removes it from all days.`)) return;
    setIsDeleting(true);
    await onDelete();
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          maxLength={20}
        />
        <div className="flex flex-wrap gap-1.5">
          {STAMP_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setColor(c.hex)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                color === c.hex ? 'scale-110 border-gray-900' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded-lg">
            cancel
          </button>
          <button onClick={handleSave} className="px-3 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: `${stamp.color}20` }}
        >
          {stamp.emoji}
        </div>
        <span className="text-sm font-medium text-foreground">{stamp.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function StampManager({ isOpen, stamps, onClose, onUpdate, onDelete }: StampManagerProps) {
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
            className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50"
          >
            <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">manage stamps</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {stamps.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">no stamps yet</p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {stamps.map((stamp) => (
                      <StampRow
                        key={stamp.id}
                        stamp={stamp}
                        onUpdate={(data) => onUpdate(stamp.id, data)}
                        onDelete={() => onDelete(stamp.id)}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/calendar/StampManager.tsx
git commit -m "feat(calendar): add StampManager for editing/deleting stamp definitions"
```

---

### Task 10: DayDetail popover

**Files:**
- Create: `src/components/calendar/DayDetail.tsx`

- [ ] **Step 1: Create `src/components/calendar/DayDetail.tsx`**

Popover shown when tapping a day cell. Shows all stamps on that day with remove buttons.

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import StampPill from './StampPill';
import type { DayStamp } from '@/types/calendar';

interface DayDetailProps {
  isOpen: boolean;
  date: string | null; // YYYY-MM-DD
  dayStamps: DayStamp[];
  onClose: () => void;
  onRemoveStamp: (dayStampId: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function DayDetail({ isOpen, date, dayStamps, onClose, onRemoveStamp }: DayDetailProps) {
  return (
    <AnimatePresence>
      {isOpen && date && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed inset-x-4 top-[20%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm z-50"
          >
            <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">{formatDate(date)}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                {dayStamps.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">no stamps yet — drag one from the tray!</p>
                ) : (
                  <div className="space-y-2">
                    {dayStamps.map((ds) => (
                      <StampPill
                        key={ds.id}
                        stamp={ds.stamp}
                        size="md"
                        onRemove={() => onRemoveStamp(ds.id)}
                        className="w-full"
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/calendar/DayDetail.tsx
git commit -m "feat(calendar): add DayDetail popover for viewing/removing stamps"
```

---

### Task 11: CalendarGrid component

**Files:**
- Create: `src/components/calendar/CalendarGrid.tsx`

- [ ] **Step 1: Create `src/components/calendar/CalendarGrid.tsx`**

The month/week calendar grid with droppable day cells. This is the largest component.

```tsx
'use client';

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import StampPill from './StampPill';
import { formatDateKey } from '@/types/calendar';
import type { DayStamp, CalendarViewType } from '@/types/calendar';

interface CalendarGridProps {
  viewType: CalendarViewType;
  currentDate: Date;
  dayStamps: DayStamp[];
  onDateClick: (date: string) => void;
  onMonthChange: (date: Date) => void;
  onViewChange: (view: CalendarViewType) => void;
  isLoading: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

function DroppableDay({
  date,
  isCurrentMonth,
  isToday,
  stamps,
  onClick,
}: {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  stamps: DayStamp[];
  onClick: () => void;
}) {
  const dateKey = formatDateKey(date);
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateKey}`,
    data: { date: dateKey },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`
        min-h-[80px] md:min-h-[100px] p-1.5 border-b border-r border-border/30 cursor-pointer
        transition-colors relative
        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
        ${isOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : ''}
        ${isToday ? 'bg-blue-50/50' : ''}
        hover:bg-gray-50
      `}
    >
      <div className="flex items-start justify-between mb-1">
        <span
          className={`
            text-xs font-medium inline-flex items-center justify-center
            ${isToday ? 'w-6 h-6 bg-blue-600 text-white rounded-full text-[11px]' : ''}
            ${!isCurrentMonth ? 'text-gray-300' : isToday ? '' : 'text-gray-600'}
          `}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="space-y-0.5">
        {stamps.slice(0, 3).map((ds) => (
          <StampPill key={ds.id} stamp={ds.stamp} size="sm" />
        ))}
        {stamps.length > 3 && (
          <div className="text-[9px] text-gray-400 pl-1">+{stamps.length - 3} more</div>
        )}
      </div>
    </div>
  );
}

export default function CalendarGrid({
  viewType,
  currentDate,
  dayStamps,
  onDateClick,
  onMonthChange,
  onViewChange,
  isLoading,
}: CalendarGridProps) {
  const today = new Date();

  // Group day stamps by date
  const stampsByDate = useMemo(() => {
    const map = new Map<string, DayStamp[]>();
    for (const ds of dayStamps) {
      const existing = map.get(ds.date) || [];
      existing.push(ds);
      map.set(ds.date, existing);
    }
    return map;
  }, [dayStamps]);

  // Generate dates for current view
  const dates = useMemo(() => {
    if (viewType === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
      });
    }

    // Month view
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

    return Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(year, month, 1 - startOffset + i);
      return d;
    });
  }, [currentDate, viewType]);

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + direction * 7);
    }
    onMonthChange(newDate);
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekLabel = viewType === 'week'
    ? `${dates[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${dates[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';

  return (
    <div className="relative bg-card rounded-xl border border-border overflow-hidden">
      {/* Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
            {viewType === 'month' ? monthLabel : weekLabel}
          </h2>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            today
          </button>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => onViewChange('month')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewType === 'month' ? 'bg-white shadow-sm text-foreground' : 'text-gray-500'
              }`}
            >
              month
            </button>
            <button
              onClick={() => onViewChange('week')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewType === 'week' ? 'bg-white shadow-sm text-foreground' : 'text-gray-500'
              }`}
            >
              week
            </button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
          <div className="text-sm text-gray-400">loading...</div>
        </div>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-7 bg-gray-50/80 border-b border-border/30">
        {DAY_NAMES.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`grid grid-cols-7 ${viewType === 'week' ? 'min-h-[200px]' : ''}`}>
        {dates.map((date) => {
          const dateKey = formatDateKey(date);
          return (
            <DroppableDay
              key={dateKey}
              date={date}
              isCurrentMonth={date.getMonth() === currentDate.getMonth()}
              isToday={isSameDay(date, today)}
              stamps={stampsByDate.get(dateKey) || []}
              onClick={() => onDateClick(dateKey)}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/calendar/CalendarGrid.tsx
git commit -m "feat(calendar): add CalendarGrid with droppable day cells"
```

---

## Chunk 4: Page Assembly + Cleanup

### Task 12: Rewrite calendar page

**Files:**
- Rewrite: `src/app/calendar/page.tsx`

- [ ] **Step 1: Rewrite `src/app/calendar/page.tsx`**

This wires everything together: DndContext, data fetching, API calls, and all components.

```tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import StampTray from '@/components/calendar/StampTray';
import StampManager from '@/components/calendar/StampManager';
import DayDetail from '@/components/calendar/DayDetail';
import CreateStampForm from '@/components/calendar/CreateStampForm';
import StampPill from '@/components/calendar/StampPill';
import { formatDateKey } from '@/types/calendar';
import type { Stamp, DayStamp, CalendarViewType } from '@/types/calendar';
import type { UserRole } from '@/types/database';

export default function CalendarPage() {
  // Core state
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [dayStamps, setDayStamps] = useState<DayStamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');

  // UI state
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeDragStamp, setActiveDragStamp] = useState<Stamp | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Track fetched range to avoid re-fetching
  const fetchedRangeRef = useRef<{ from: string; to: string } | null>(null);

  // TODO: get actual user from auth context
  const currentUser: UserRole = 'meedo';

  // DnD sensors with touch delay to differentiate from scroll
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Fetch all stamp definitions
  const fetchStamps = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/stamps');
      const json = await res.json();
      if (json.success) setStamps(json.data || []);
    } catch (err) {
      console.error('failed to fetch stamps:', err);
    }
  }, []);

  // Fetch day stamps for a date range
  const fetchDayStamps = useCallback(async (centerDate: Date, force = false) => {
    const from = new Date(centerDate.getFullYear(), centerDate.getMonth() - 1, 1);
    const to = new Date(centerDate.getFullYear(), centerDate.getMonth() + 2, 0);
    const fromStr = formatDateKey(from);
    const toStr = formatDateKey(to);

    if (!force && fetchedRangeRef.current) {
      if (fromStr >= fetchedRangeRef.current.from && toStr <= fetchedRangeRef.current.to) return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/days?from=${fromStr}&to=${toStr}`);
      const json = await res.json();
      if (json.success) {
        setDayStamps(json.data || []);
        fetchedRangeRef.current = { from: fromStr, to: toStr };
      }
    } catch (err) {
      console.error('failed to fetch day stamps:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStamps();
    fetchDayStamps(new Date());
  }, [fetchStamps, fetchDayStamps]);

  // Handle month/week navigation
  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    fetchDayStamps(date);
  }, [fetchDayStamps]);

  // Place a stamp on a day (API call + optimistic update)
  const placeStamp = useCallback(async (stampId: string, date: string) => {
    const stamp = stamps.find((s) => s.id === stampId);
    if (!stamp) return;

    // Check if already placed
    if (dayStamps.some((ds) => ds.stamp_id === stampId && ds.date === date)) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimistic: DayStamp = {
      id: tempId,
      stamp_id: stampId,
      date,
      placed_by: currentUser,
      placed_at: new Date().toISOString(),
      stamp,
    };
    setDayStamps((prev) => [...prev, optimistic]);

    try {
      const res = await fetch('/api/calendar/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stamp_id: stampId, date, placed_by: currentUser }),
      });
      const json = await res.json();

      if (json.success) {
        // Replace temp with real data
        setDayStamps((prev) => prev.map((ds) => (ds.id === tempId ? json.data : ds)));
      } else {
        // Rollback on failure
        setDayStamps((prev) => prev.filter((ds) => ds.id !== tempId));
      }
    } catch {
      // Rollback on error
      setDayStamps((prev) => prev.filter((ds) => ds.id !== tempId));
    }
  }, [stamps, dayStamps, currentUser]);

  // Remove a stamp from a day
  const removeStamp = useCallback(async (dayStampId: string) => {
    // Optimistic removal
    const removed = dayStamps.find((ds) => ds.id === dayStampId);
    setDayStamps((prev) => prev.filter((ds) => ds.id !== dayStampId));

    try {
      const res = await fetch(`/api/calendar/days/${dayStampId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success && removed) {
        // Rollback
        setDayStamps((prev) => [...prev, removed]);
      }
    } catch {
      if (removed) setDayStamps((prev) => [...prev, removed]);
    }
  }, [dayStamps]);

  // Create a new stamp definition
  const createStamp = useCallback(async (data: { name: string; emoji: string; color: string }) => {
    const res = await fetch('/api/calendar/stamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, created_by: currentUser }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setStamps((prev) => [...prev, json.data]);
  }, [currentUser]);

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragStamp((event.active.data.current?.stamp as Stamp) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragStamp(null);
    const { active, over } = event;
    if (!over) return;

    const stamp = active.data.current?.stamp as Stamp | undefined;
    const date = over.data.current?.date as string | undefined;
    if (stamp && date) {
      placeStamp(stamp.id, date);
    }
  };

  // Get stamps for selected date (for DayDetail)
  const selectedDayStamps = selectedDate
    ? dayStamps.filter((ds) => ds.date === selectedDate)
    : [];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-foreground">our calendar</h1>
            <p className="text-gray-500 mt-1">drag stamps onto days to plan our week</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          <CalendarGrid
            viewType={viewType}
            currentDate={currentDate}
            dayStamps={dayStamps}
            onDateClick={(date) => setSelectedDate(date)}
            onMonthChange={handleDateChange}
            onViewChange={setViewType}
            isLoading={isLoading}
          />
        </div>

        {/* Stamp Tray */}
        <div className="sticky bottom-0">
          <StampTray
            stamps={stamps}
            onCreateNew={() => setIsCreateFormOpen(true)}
            onManage={() => setIsManagerOpen(true)}
          />
        </div>

        {/* Drag overlay (ghost following cursor) */}
        <DragOverlay>
          {activeDragStamp && (
            <div className="opacity-80 pointer-events-none">
              <StampPill stamp={activeDragStamp} size="md" />
            </div>
          )}
        </DragOverlay>

        {/* Day Detail Popover */}
        <DayDetail
          isOpen={!!selectedDate}
          date={selectedDate}
          dayStamps={selectedDayStamps}
          onClose={() => setSelectedDate(null)}
          onRemoveStamp={removeStamp}
        />

        {/* Create Stamp Modal */}
        <CreateStampForm
          isOpen={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
          onSubmit={createStamp}
        />

        {/* Stamp Manager (edit/delete stamps) */}
        <StampManager
          isOpen={isManagerOpen}
          stamps={stamps}
          onClose={() => setIsManagerOpen(false)}
          onUpdate={async (id, data) => {
            const res = await fetch(`/api/calendar/stamps/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            const json = await res.json();
            if (json.success) {
              setStamps((prev) => prev.map((s) => (s.id === id ? json.data : s)));
              // Refresh day stamps to get updated stamp data
              fetchDayStamps(currentDate, true);
            }
          }}
          onDelete={async (id) => {
            const res = await fetch(`/api/calendar/stamps/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
              setStamps((prev) => prev.filter((s) => s.id !== id));
              setDayStamps((prev) => prev.filter((ds) => ds.stamp_id !== id));
            }
          }}
        />
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 2: Verify the page compiles**

Run: `cd /home/alanzhang/valentinesday && bun run build 2>&1 | tail -20`
Expected: Build succeeds or shows only pre-existing errors (not related to calendar)

- [ ] **Step 3: Test manually**

Run: `cd /home/alanzhang/valentinesday && bun run dev`
Then visit http://localhost:3000/calendar and verify:
1. Calendar grid renders with month navigation
2. Stamp tray appears at bottom with 4 starter stamps
3. Drag a stamp from tray onto a day → stamp pill appears in the day cell
4. Click a day → DayDetail popover shows stamps with remove buttons
5. Remove a stamp → it disappears from the day
6. Click "+ new stamp" → CreateStampForm modal opens
7. Create a new stamp → it appears in the tray
8. Switch to week view → bigger day cells, drag-drop still works
9. Navigate months → data loads for new range

- [ ] **Step 4: Commit**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat(calendar): rewrite calendar page with stamp drag-and-drop system"
```

---

### Task 13: Remove old calendar code

**Files:**
- Delete: `src/components/calendar/EventForm.tsx`
- Delete: `src/components/calendar/CalendarView.tsx`
- Delete: `src/lib/google-calendar.ts`
- Delete: `src/app/api/calendar/route.ts`
- Delete: `src/app/api/calendar/sync/route.ts`

- [ ] **Step 1: Remove old files**

```bash
cd /home/alanzhang/valentinesday
rm src/components/calendar/EventForm.tsx
rm src/components/calendar/CalendarView.tsx
rm src/lib/google-calendar.ts
rm src/app/api/calendar/route.ts
rm -rf src/app/api/calendar/sync/
```

- [ ] **Step 2: Check for remaining imports of removed files**

Run: `cd /home/alanzhang/valentinesday && grep -r "google-calendar\|EventForm\|CalendarView\|REGULAR_SCHEDULE\|EVENT_TYPE_COLORS\|EVENT_TYPE_LABELS" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test."`

Expected: No results (all references should be gone since page.tsx was rewritten)

If any references remain, update those files to remove the imports.

- [ ] **Step 3: Verify build still works**

Run: `cd /home/alanzhang/valentinesday && bun run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(calendar): remove old event system and Google Calendar integration"
```

---

### Task 14: Update CLAUDE.md files

**Files:**
- Modify: `src/app/calendar/CLAUDE.md`
- Modify: `src/components/calendar/CLAUDE.md`

- [ ] **Step 1: Update `src/app/calendar/CLAUDE.md`**

Replace contents with current state of the calendar feature.

- [ ] **Step 2: Update `src/components/calendar/CLAUDE.md`**

Replace contents documenting the new component structure.

- [ ] **Step 3: Commit**

```bash
git add src/app/calendar/CLAUDE.md src/components/calendar/CLAUDE.md
git commit -m "docs(calendar): update CLAUDE.md files for stamp system"
```
