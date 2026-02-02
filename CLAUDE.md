# Meedobeedo v2.0

## What This Is

A private digital world for exactly 2 people (Meedo and Beedo). This is a relationship website - think of it like a private social network, game platform, and utility app combined, but exclusively for a couple.

**The vibe:** Clean modern UI (shadcn-style) with hand-drawn crayon illustrations. The contrast IS the joke - sophisticated infrastructure built by 2.3 year olds who understand epsilon but not the number 3.

## Core Principles

1. **Private by default** - Only 2 whitelisted emails can access this. Everyone else gets rejected.
2. **Fun over function** - If it's not fun or cute, question if we need it.
3. **Simple > clever** - It's a 2-person site. Don't over-engineer.
4. **The characters matter** - Meedo and Beedo are the heart of this. They should be everywhere.

## The Lore

- **Meedo** - The loving, playful one (him)
- **Beedo** - Baby Meedo, mischievous with a bow (her)
- **Mod** - Their god (like God but with an M). Wishes go to Mod.
- **MTO/BTO** - Meedo/Beedo Time Off. Like PTO but for the relationship when traveling.
- **Meedo Coins** - Currency earned through games, spent in shop

## Features (v2.0)

| Feature | Description |
|---------|-------------|
| **Auth** | Google OAuth + whitelist (2 emails only) + password gate |
| **Photos** | Upload, gallery, slideshow mode |
| **Sticker Board** | Whiteboard with draggable Meedo/Beedo stickers |
| **Calendar** | Full Google Calendar sync, MTO/BTO, hangout schedule |
| **Wishing Well** | Requests to Mod, status tracking |
| **Coupons** | Both create, both redeem |
| **Mini Games** | Spelling Mee, Memory, Tap the Beedo, Slot Machine |
| **Shop** | Buy coupons + real rewards with Meedo Coins |
| **Food Picker** | Weighted random restaurant picker |
| **Engagement** | Newsletter, badges, news ticker, countdowns |

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animation:** Framer Motion
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Email:** Resend or SendGrid
- **Calendar:** Google Calendar API

## Design Direction

### UI Components
- Clean, modern, proper spacing
- shadcn/ui as the component foundation
- Consistent typography hierarchy
- Smooth animations

### Illustrations
- Black and white Meedo/Beedo characters
- Hand-drawn, crayon/construction paper aesthetic
- Characters in various poses and expressions
- Wobbly borders, texture accents where appropriate

### Colors
- Primary: Black & White (matching characters)
- Accents: Soft pastels (TBD)
- Background: Clean white or very light gray

## Project Structure

```
valentinesday/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   │   ├── ui/        # shadcn components
│   │   └── ...        # feature components
│   ├── lib/           # Utilities, supabase client
│   └── types/         # TypeScript types
├── public/
│   ├── stickers/      # Meedo/Beedo SVG stickers
│   ├── badges/        # Achievement badge icons
│   └── fonts/         # Custom fonts (carrots, cheeky)
├── docs/
│   └── plans/         # Design docs, specs
└── .worktrees/        # Isolated feature branches
```

## Worktree Development

Each feature is developed in isolation using git worktrees:

| Worktree | Branch | Purpose |
|----------|--------|---------|
| `.worktrees/design-system` | `feature/design-system` | Components, styles, stickers |
| `.worktrees/database` | `feature/database` | Supabase schema, types |
| `.worktrees/auth` | `feature/auth` | Google OAuth, whitelist, password |
| (more to come) | | |

**Full design doc:** `docs/plans/2026-02-01-meedobeedo-v2-design.md`

## For Agents Working on This Project

1. **Read the design doc** before starting work
2. **Stay in your worktree** - don't modify files outside your scope
3. **Commit your work** when done, but don't push
4. **Keep it simple** - remember it's just 2 users
5. **Match the vibe** - clean UI, cute illustrations, fun copy

## Communication Style

The site should feel like it was built by Meedo for Beedo with love. Copy should be:
- Playful and cute
- Reference the lore (Mod, MTO/BTO, etc.)
- Not corporate or generic
- Occasionally funny

Examples:
- "This nation is closed to outsiders" (rejection page)
- "Wish upon Mod" (wishing well)
- "Beedo Time Off requested" (calendar)
