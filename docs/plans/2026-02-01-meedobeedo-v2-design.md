# Meedobeedo v2.0 Design Document

## Overview

A private digital world for Meedo and Beedo - a relationship website that only two people can access. Features a mix of clean modern UI (shadcn/Anthropic-style) with hand-drawn crayon illustrations of the Meedo/Beedo characters.

**Tech Stack:**
- Next.js (existing)
- Tailwind CSS (existing)
- Framer Motion (existing)
- Google OAuth + Google Calendar API
- Database: TBD (Supabase recommended for auth + realtime + storage)
- Email: TBD (Resend or SendGrid for transactional emails)

---

## 1. Authentication & Access Control

### Requirements
- Google OAuth with strict whitelist (exactly 2 email addresses)
- Secondary password gate after successful OAuth
- Anyone not on whitelist sees a rejection page ("this nation is closed to outsiders")
- Session persistence so they don't have to re-auth constantly

### Flow
```
1. User visits site
2. Redirect to Google OAuth
3. Check email against whitelist
   - Not on list → Rejection page (funny, themed)
   - On list → Continue to password gate
4. Enter shared secret password
   - Wrong → "nice try" message
   - Correct → Session created, enter the site
5. Subsequent visits check session, skip auth if valid
```

### Implementation Notes
- Store whitelist in environment variables (not hardcoded)
- Use NextAuth.js with Google provider
- Custom middleware to check whitelist before allowing access
- Password stored as hashed env var, compared on submission
- Session duration: 30 days recommended

---

## 2. Photo Album

### Requirements
- Both users can upload photos through the website
- Photos organized however they want (no forced structure for v2.0)
- Slideshow mode with auto-advance
- Images stored in cloud storage (Supabase Storage or S3)

### Features
- Upload interface (drag & drop or file picker)
- Gallery grid view (existing, upgrade)
- Slideshow mode:
  - Full-screen display
  - Auto-advance with configurable speed
  - Manual navigation (arrows, keyboard)
  - Optional background music (stretch goal)
- Delete/manage photos

### Data Model
```
Photo {
  id: uuid
  url: string
  uploaded_by: 'meedo' | 'beedo'
  uploaded_at: timestamp
  caption?: string
}
```

---

## 3. Sticker Board (Whiteboard)

### Requirements
- Persistent whiteboard canvas
- Drag & drop Meedo/Beedo stickers onto the canvas
- Save multiple boards
- Stickers include Meedo/Beedo in various poses, expressions, outfits

### Features
- Canvas with pan/zoom
- Sticker library sidebar
- Drag stickers onto canvas, position freely
- Resize/rotate stickers
- Create new board / load existing board
- Auto-save

### Sticker Organization
```
/public/stickers/
  meedo-default.svg
  meedo-waving.svg
  meedo-excited.svg
  meedo-sad.svg
  meedo-angry.svg
  beedo-default.svg
  beedo-waving.svg
  beedo-excited.svg
  beedo-with-bow.svg
  ... (easily replaceable by dropping in new files)
```

### Data Model
```
Board {
  id: uuid
  name: string
  created_by: 'meedo' | 'beedo'
  created_at: timestamp
  updated_at: timestamp
  canvas_data: JSON (sticker positions, scales, rotations)
}
```

---

## 4. Calendar & MTO/BTO

### Requirements
- Full two-way sync with Google Calendar
- Changes on site → push to Google Calendar in real-time
- Display regular schedule (Tues/Sat at Meedo's, Wed/Fri at Beedo's, Sun day dates)
- MTO (Meedo Time Off) / BTO (Beedo Time Off) for work travel

### Features
- Calendar view on site (month/week view)
- Create/edit/delete events
- Event types:
  - Regular hangout (recurring)
  - MTO/BTO (time off, like PTO)
  - Special events (dates, trips, anniversaries)
- Color coding by event type
- Sync status indicator

### Google Calendar Integration
- Use Google Calendar API v3
- OAuth scope: `https://www.googleapis.com/auth/calendar`
- Dedicated calendar for Meedobeedo events (not polluting personal calendars)
- Webhook or polling for external changes (stretch goal)

### Data Model
```
Event {
  id: uuid
  google_event_id: string (for sync)
  title: string
  type: 'hangout' | 'mto' | 'bto' | 'date' | 'special'
  start: datetime
  end: datetime
  location?: string
  created_by: 'meedo' | 'beedo'
}
```

---

## 5. Wishing Well (Request System)

### Requirements
- Freeform text input for wishes/requests
- Wishes go to "Mod" (god but with an M)
- Email notification sent to Meedo (admin) when wish submitted
- Wish history with status tracking (pending, granted, denied)
- Fairytale aesthetic

### Features
- Wishing well UI (themed input)
- Submit wish → email to admin
- View past wishes with status
- Admin can update wish status (granted/denied with optional note)

### Data Model
```
Wish {
  id: uuid
  text: string
  wished_by: 'meedo' | 'beedo'
  wished_at: timestamp
  status: 'pending' | 'granted' | 'denied'
  status_note?: string
  granted_at?: timestamp
}
```

---

## 6. Coupon System

### Requirements
- Both users can create coupons
- Both users can redeem coupons
- Coupons have a title, description, optional expiry
- Track redemption history

### Features
- Create coupon form
- Coupon gallery (available, redeemed, expired)
- Redeem flow (click to redeem, confirmation)
- Email notification on redemption
- Coupon designs with Meedo/Beedo illustrations

### Data Model
```
Coupon {
  id: uuid
  title: string
  description: string
  created_by: 'meedo' | 'beedo'
  created_at: timestamp
  expires_at?: timestamp
  redeemed: boolean
  redeemed_at?: timestamp
  redeemed_by?: 'meedo' | 'beedo'
}
```

---

## 7. Mini Games

### 7.1 Spelling Mee (existing)
- Upgrade with coin rewards
- Track high scores

### 7.2 Meedo Memory (existing)
- Upgrade with coin rewards
- Track high scores

### 7.3 Tap the Beedo (new)
- Whack-a-mole style game
- Beedo pops up in random positions
- Tap to score points
- Time limit (30-60 seconds)
- Coin rewards based on score

### 7.4 Slot Machine (new)
- Classic 3-reel slot machine
- Spend coins to spin
- Win coins on matches
- Meedo/Beedo themed symbols
- Near-miss animations for drama

### Game Rewards
- Each game awards Meedo Coins based on performance
- Coins stored per user
- Leaderboards optional (it's just 2 people lol)

---

## 8. Economy & Shop

### Meedo Coins
- Earned through mini games
- Tiered earning: harder games = more coins
- Roughly balanced for 2 hrs/week play = small reward

### Shop Items

**Coupons (purchasable):**
- Pre-made coupons at set prices
- Examples: "Movie Night Pick" (30 coins), "Backrub" (50 coins)

**Real Rewards (tiered):**
- Small (100-200 coins): Boba, snacks
- Medium (300-500 coins): Dinner choice, activity pick
- Large (1000+ coins): Fancy dinner, experience

### Redemption Flow
1. User purchases reward with coins
2. Email confirmation sent to user
3. Email notification sent to admin (Meedo)
4. User shows confirmation to claim IRL
5. Admin marks as fulfilled

### Data Model
```
ShopItem {
  id: uuid
  name: string
  description: string
  type: 'coupon' | 'reward'
  price: number (coins)
  tier?: 'small' | 'medium' | 'large'
}

Purchase {
  id: uuid
  item_id: uuid
  purchased_by: 'meedo' | 'beedo'
  purchased_at: timestamp
  fulfilled: boolean
  fulfilled_at?: timestamp
}

UserBalance {
  user: 'meedo' | 'beedo'
  coins: number
}
```

---

## 9. Food Picker

### Requirements
- Help decide where/what to eat
- Randomizer with weighted preferences
- Save favorite spots

### Features
- Add restaurants/food options
- Tag by cuisine, price, location
- Random picker (spin wheel or slot-style)
- "Not that" button to re-roll
- Recent picks history

### Data Model
```
FoodOption {
  id: uuid
  name: string
  cuisine?: string
  price_range?: '$' | '$$' | '$$$'
  location?: string
  added_by: 'meedo' | 'beedo'
  weight: number (preference, higher = more likely)
}
```

---

## 10. Engagement Features

### 10.1 Newsletter / Automated Emails
- Weekly digest email
- Triggered emails:
  - "Beedo misses you" (3+ days no visit)
  - "Coupon expiring soon"
  - "Surprise drop available"
  - "Wish granted!"
- Fun, themed copy

### 10.2 Achievement Badges
- Unlock badges for milestones:
  - "First Visit"
  - "5 Day Streak"
  - "First Coupon Redeemed"
  - "Spelling Mee Champion"
  - "Big Spender" (1000 coins spent)
  - etc.
- Badge display on profile/dashboard
- Notification on unlock

### 10.3 Breaking News Ticker
- Scrolling ticker on homepage
- Fake Meedobeedo headlines:
  - "BREAKING: Beedo caught stealing snacks from national reserve"
  - "MTO ALERT: Meedo traveling, nation on standby"
  - "ECONOMY UPDATE: Coin inflation at 0%, economists baffled"
- Rotate through pre-written headlines + dynamic ones based on activity

### 10.4 Countdown Timers
- Display countdowns to important dates:
  - Anniversaries
  - Upcoming trips
  - Special events
- Configurable by admin
- Show on dashboard

### Data Models
```
Badge {
  id: string (slug)
  name: string
  description: string
  icon: string (path to image)
}

UserBadge {
  user: 'meedo' | 'beedo'
  badge_id: string
  earned_at: timestamp
}

NewsHeadline {
  id: uuid
  text: string
  type: 'static' | 'dynamic'
  active: boolean
}

Countdown {
  id: uuid
  title: string
  target_date: datetime
  active: boolean
}
```

---

## 11. UI/UX Design Direction

### Visual Style
- **Layout & Components:** Clean, modern, shadcn-inspired
  - Proper spacing, typography hierarchy
  - Smooth animations (Framer Motion)
  - Consistent component library
- **Illustrations:** Hand-drawn, crayon/construction paper aesthetic
  - Meedo/Beedo characters in various poses
  - Decorative elements (wobbly borders, texture accents)
  - Icons in hand-drawn style

### Color Palette
- Primary: Black & White (matching Meedo/Beedo characters)
- Accents: TBD (suggest soft pastels or crayon colors)
- Background: Clean white or very light gray

### Typography
- Keep existing custom fonts (carrots, cheeky)
- Clean sans-serif for body text

### Navigation
- Simple top nav or sidebar
- Sections:
  - Home/Dashboard
  - Photos
  - Sticker Board
  - Calendar
  - Wishing Well
  - Coupons
  - Games
  - Shop

---

## 12. Technical Architecture

### Database Schema (Supabase recommended)
- Users (linked to Google auth)
- Photos
- Boards (sticker boards)
- Events (calendar)
- Wishes
- Coupons
- Shop Items
- Purchases
- User Balances
- Badges / User Badges
- Headlines
- Countdowns

### API Routes
- `/api/auth/*` - NextAuth endpoints
- `/api/photos/*` - CRUD for photos
- `/api/boards/*` - CRUD for sticker boards
- `/api/calendar/*` - Calendar sync
- `/api/wishes/*` - Wish CRUD
- `/api/coupons/*` - Coupon CRUD
- `/api/games/*` - Game score submission, coin rewards
- `/api/shop/*` - Shop items, purchases
- `/api/admin/*` - Admin actions (wish status, fulfillment)

### File Storage
- Supabase Storage or S3 for:
  - Uploaded photos
  - User-generated content

### Email Service
- Resend or SendGrid
- Templates for each email type
- Triggered via API routes or background jobs

---

## 13. Feature Breakdown for Worktrees

Each feature can be developed in isolation:

| Feature | Worktree Branch | Dependencies |
|---------|-----------------|--------------|
| Auth & Access | `feature/auth` | None |
| Database Setup | `feature/database` | None |
| Photo Album | `feature/photos` | Auth, Database |
| Sticker Board | `feature/sticker-board` | Auth, Database |
| Calendar | `feature/calendar` | Auth, Database, Google API |
| Wishing Well | `feature/wishing-well` | Auth, Database, Email |
| Coupon System | `feature/coupons` | Auth, Database |
| Mini Games | `feature/games` | Auth, Database |
| Economy & Shop | `feature/shop` | Auth, Database, Games |
| Food Picker | `feature/food-picker` | Auth, Database |
| Engagement (badges, ticker, etc) | `feature/engagement` | Auth, Database |
| Email System | `feature/email` | Database |
| UI/Design System | `feature/design-system` | None |

### Recommended Build Order
1. `feature/design-system` - Component library, styles
2. `feature/database` - Schema, Supabase setup
3. `feature/auth` - Google OAuth, whitelist, password gate
4. `feature/photos` - Album with upload
5. `feature/calendar` - Google Calendar integration
6. `feature/coupons` - Create/redeem coupons
7. `feature/wishing-well` - Request system
8. `feature/games` - Mini games with coin rewards
9. `feature/shop` - Economy, purchasing
10. `feature/sticker-board` - Whiteboard canvas
11. `feature/food-picker` - Restaurant randomizer
12. `feature/engagement` - Badges, ticker, countdowns
13. `feature/email` - Newsletter, notifications

---

## 14. Open Questions / Future Considerations

- **Notifications:** Push notifications via PWA? Or just email?
- **Mobile:** Responsive web or dedicated mobile app later?
- **Backup:** Photo backup strategy?
- **Analytics:** Track visits/engagement? (probably overkill)
- **Cosmetics:** Site themes, profile customization (backburner)

---

## Appendix: Sticker Asset List

Initial stickers to create (SVG, easily replaceable):

**Meedo:**
- meedo-default
- meedo-waving
- meedo-excited
- meedo-sad
- meedo-angry
- meedo-sleeping
- meedo-eating
- meedo-thinking

**Beedo:**
- beedo-default (with bow)
- beedo-waving
- beedo-excited
- beedo-sad
- beedo-angry
- beedo-sleeping
- beedo-eating
- beedo-mischievous

**Props/Objects:**
- heart
- star
- speech-bubble
- thought-bubble
- food items (boba, snacks)
- decorative elements
