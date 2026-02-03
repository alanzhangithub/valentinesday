# Meedobeedo v2.0

## What This Is

A private digital world for exactly 2 people (Meedo and Beedo). This is a relationship website - think of it like a private social network, game platform, and utility app combined, but exclusively for a couple.

**The vibe:** Clean modern UI (shadcn-style) with hand-drawn crayon illustrations. The contrast IS the joke - sophisticated infrastructure built by 2.3 year olds who understand epsilon but not the number 3.

## Current Status (Feb 2026)

**All features merged and polished!** The v2.0 overhaul is complete:

| Feature | Status | Route |
|---------|--------|-------|
| Auth | Done | Google OAuth + whitelist + password gate |
| Home | Done | `/` - Feature grid with all links |
| Photos | Polished | `/photos` - Upload, gallery, slideshow with swipe |
| Sticker Board | Done | `/sticker-board` - Drag & drop stickers |
| Calendar | Polished | `/calendar` - Events with month nav |
| Wishing Well | Done | `/wishing-well` - Wishes to Mod |
| Coupons | Done | `/coupons` - Create & redeem love coupons |
| Games | Done | `/games` - Spelling Mee, Memory, Tap the Beedo, Slots |
| Shop | Polished | `/shop` - Buy rewards with Meedo Coins |
| Food Picker | Done | `/food-picker` - Spin wheel for restaurants |

### Environment Setup

Required `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_ROLE_KEY=[key]
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[secret]
GOOGLE_CLIENT_ID=[id]
GOOGLE_CLIENT_SECRET=[secret]
ALLOWED_EMAIL_1=[meedo email]
ALLOWED_EMAIL_2=[beedo email]
```

Note: Password hash is currently hardcoded in `src/lib/auth.ts` due to env var `$` interpretation issues.

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

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animation:** Framer Motion
- **Database:** Supabase (PostgreSQL)
- **Auth:** NextAuth.js with Google OAuth
- **Package Manager:** Bun

## Project Structure

```
valentinesday/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── photos/       # Photo gallery
│   │   ├── games/        # Mini games
│   │   ├── shop/         # Meedo coin shop
│   │   ├── calendar/     # Event calendar
│   │   ├── coupons/      # Love coupons
│   │   ├── wishing-well/ # Wishes to Mod
│   │   ├── sticker-board/# Shared sticker canvas
│   │   └── food-picker/  # Restaurant spinner
│   ├── components/       # React components
│   │   ├── layout/       # Navigation, wrappers
│   │   ├── photos/       # Photo components
│   │   ├── games/        # Game components
│   │   ├── shop/         # Shop components
│   │   └── ...           # Feature components
│   ├── lib/              # Utilities, supabase client
│   └── types/            # TypeScript types
├── public/
│   └── stickers/         # Meedo/Beedo SVG stickers
└── .worktrees/           # (Legacy) Feature worktrees
```

## Development

```bash
bun install
bun run dev
```

Then visit http://localhost:3000

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
