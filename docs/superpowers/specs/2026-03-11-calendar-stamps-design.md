# Calendar Stamp System - Design Spec

## Overview

Replace the existing event-based calendar with a drag-and-drop stamp system. Stamps are simple day markers (no times) that can be stacked on any day. The system is backed by Supabase (no Google Calendar sync).

## Problem

The current calendar has a full event creation flow (title, type, start/end times, location, notes) that's overkill for how Meedo and Beedo actually use it. 90% of entries are repetitive: going to each other's houses, playing pickleball, etc. The friction of creating an event for routine activities means the calendar doesn't get used.

## Solution

Pre-defined stamps that can be dragged onto calendar days in one gesture. Custom stamps can be created with minimal effort (name, emoji, color). Multiple stamps stack on a single day.

## User Interaction

### Adding stamps to days
1. User sees the calendar in month view (default) or week view
2. A bottom tray shows all available stamps as horizontal scrollable pills
3. User drags a stamp from the tray onto a calendar day cell
4. The stamp appears as a colored pill in the day cell
5. Multiple stamps can be placed on the same day — they stack vertically

### Week view for mobile
- Month view day cells are small on phone screens
- User can switch to week view where cells are larger and drag-drop is easier
- Week view is the recommended interaction mode on mobile

### Viewing and removing stamps
- Tap any day cell to open a mini detail popover
- Popover shows all stamps on that day with remove buttons next to each
- Tap remove (X) to delete a stamp from that day

### Creating new stamps
- Tap "+ new stamp" button at the end of the stamp tray
- Simple form with 3 fields:
  - Name (text, e.g. "gym")
  - Emoji (emoji picker)
  - Color (color picker from preset palette)
- New stamp immediately appears in the tray for both users

### Deleting/editing stamp definitions
- Settings icon or gear button on the tray opens a stamp management view
- Can edit name, emoji, color or delete any stamp
- Deleting a stamp definition removes all placements of that stamp

### Multi-user semantics
- Stamps are **collaborative** — either user can place or remove any stamp on any day
- The `placed_by` field is informational (for history), not a permission boundary
- Both users see the same calendar state at all times

## Visual Design

### Stamp rendering on calendar
- Each stamp renders as a small colored pill with emoji + truncated label
- Pills stack vertically within a day cell
- Example for a loaded day:
  ```
  | 14                |
  | 🏠 beedo's        |
  | 🔥 mex            |
  | 🏓 pickleball     |
  ```

### Bottom stamp tray
- Fixed at bottom of calendar view
- Horizontally scrollable row of stamp pills
- Each pill shows emoji + name with the stamp's background color
- Dashed "+ new stamp" button at the end
- Tray has a subtle top border/shadow to separate from calendar

### Today indicator
- Today's date number shown in a blue circle (existing pattern)
- Day cell gets a light blue background tint

### Color palette (starter stamps)
- Blue (`#dbeafe` / `#93c5fd`): meedo's house
- Pink (`#fce7f3` / `#f9a8d4`): beedo's house
- Green (`#d1fae5` / `#6ee7b7`): pickleball
- Yellow (`#fde68a` / `#fbbf24`): mex

## Starter Stamps

| Name | Emoji | Color | Description |
|------|-------|-------|-------------|
| meedo's | 🏠 | blue | Going to Meedo's house |
| beedo's | 🏠 | pink | Going to Beedo's house |
| pickleball | 🏓 | green | Playing pickleball |
| mex | 🔥 | yellow | Having MEX |

These are seeded via SQL insert in the migration script (same pattern as `user_balances` seed in `schema.sql`). Both users can create additional stamps.

## Data Model (Supabase)

### `stamps` table
```sql
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,        -- stored as hex code (e.g. '#dbeafe'), rendered via inline styles
  created_by user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_default BOOLEAN DEFAULT FALSE  -- for starter stamps
);
```

### `day_stamps` table
```sql
CREATE TABLE day_stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stamp_id UUID NOT NULL REFERENCES stamps(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  placed_by user_role NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stamp_id, date)  -- can't place same stamp twice on same day
);

CREATE INDEX idx_day_stamps_date ON day_stamps(date);
```

### Key constraint
- `UNIQUE(stamp_id, date)` — same stamp can't be on the same day twice (no duplicate "pickleball" on Tuesday), but different stamps can coexist on the same day

## TypeScript Types

Defined in `src/types/calendar.ts` (replaces existing contents):

```typescript
export type User = 'meedo' | 'beedo';

export interface Stamp {
  id: string;
  name: string;
  emoji: string;
  color: string; // hex code
  created_by: User;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

export interface DayStamp {
  id: string;
  stamp_id: string;
  date: string; // YYYY-MM-DD
  placed_by: User;
  placed_at: string;
  stamp: Stamp; // joined from stamps table
}

export type CalendarViewType = 'month' | 'week';
```

## API Routes

### `GET /api/calendar/stamps`
Returns all stamp definitions.

### `POST /api/calendar/stamps`
Create a new stamp definition. Body: `{ name, emoji, color }`.

### `PUT /api/calendar/stamps/[id]`
Update a stamp definition. Body: `{ name?, emoji?, color? }`.

### `DELETE /api/calendar/stamps/[id]`
Delete a stamp definition (cascades to all placements).

### `GET /api/calendar/days?from=YYYY-MM-DD&to=YYYY-MM-DD`
Returns all stamp placements in a date range, joined with stamp definitions. Response shape:
```json
{
  "placements": [
    {
      "id": "uuid",
      "date": "2026-03-11",
      "placed_by": "meedo",
      "placed_at": "...",
      "stamp": { "id": "uuid", "name": "pickleball", "emoji": "🏓", "color": "#d1fae5" }
    }
  ]
}
```
Frontend groups by date for rendering.

### `POST /api/calendar/days`
Place a stamp on a day. Body: `{ stamp_id, date }`.

### `DELETE /api/calendar/days/[id]`
Remove a stamp placement from a day.

## Component Structure

### Pages
- `src/app/calendar/page.tsx` — main calendar page (rewrite)

### Components
- `src/components/calendar/CalendarGrid.tsx` — month/week grid with drop targets
- `src/components/calendar/StampTray.tsx` — bottom draggable stamp tray
- `src/components/calendar/DayDetail.tsx` — popover when tapping a day
- `src/components/calendar/StampPill.tsx` — individual stamp pill (used in grid, tray, and detail)
- `src/components/calendar/CreateStampForm.tsx` — modal for creating new stamps

### Removed
- `src/components/calendar/EventForm.tsx` — replaced by stamp system
- `src/components/calendar/CalendarView.tsx` — replaced by CalendarGrid

## Drag and Drop

Use a lightweight drag-and-drop library compatible with touch:
- **`@dnd-kit`** (recommended) — modern, accessible, great touch support, works well with React
- Alternatives: `react-beautiful-dnd` (deprecated), native HTML5 DnD (poor touch support)

### DnD behavior
- Stamp pills in the tray are draggable sources
- Day cells in the calendar grid are drop targets
- On drop: POST to `/api/calendar/days` with stamp_id and date
- Visual feedback during drag: ghost pill follows cursor/finger, target day cell highlights
- If stamp already exists on that day, drop is rejected (no duplicate)
- On API failure after drop: stamp reverts (optimistic UI with rollback), brief toast error

## Migration

### What gets removed
- Google Calendar integration (`src/lib/google-calendar.ts`)
- Google Calendar API routes (`src/app/api/calendar/route.ts`, `src/app/api/calendar/sync/route.ts`)
- Old event types and form (`EventForm.tsx`, `CalendarView.tsx`)
- Old calendar types (`src/types/calendar.ts` — `REGULAR_SCHEDULE`, `EVENT_TYPE_COLORS`, `EVENT_TYPE_LABELS`, event types)
- `events` table usage (table can remain for now, just unused)
- Google Calendar env vars no longer required

### What gets added
- `stamps` and `day_stamps` tables in Supabase
- New API routes under `/api/calendar/`
- New components (CalendarGrid, StampTray, DayDetail, StampPill, CreateStampForm)
- `@dnd-kit` package dependency

## Data Access

All API routes use the Supabase **service role key** (server-side only), not the anon key. No RLS policies needed on `stamps` or `day_stamps` — access control is handled at the API layer by NextAuth session validation.

## PWA

Making the app a PWA is a separate concern but related — the calendar being the primary use case means it should load fast and feel native. PWA setup (service worker, manifest, icons) should be handled as a follow-up task after the stamp system is built.

## Out of Scope

- Google Calendar sync
- Time-based events
- Recurring stamp patterns (auto-fill weekly schedules)
- Push notifications
- PWA implementation (separate task)
- iOS widget
