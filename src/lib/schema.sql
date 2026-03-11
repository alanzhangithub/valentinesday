-- Meedobeedo v2.0 Database Schema
-- This schema is designed for Supabase (PostgreSQL)
-- Run this in the Supabase SQL editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TYPES / ENUMS
-- ============================================

-- User role enum (only 2 people: meedo or beedo)
CREATE TYPE user_role AS ENUM ('meedo', 'beedo');

-- Event type enum for calendar
CREATE TYPE event_type AS ENUM ('hangout', 'mto', 'bto', 'date', 'special');

-- Wish status enum
CREATE TYPE wish_status AS ENUM ('pending', 'granted', 'denied');

-- Shop item type enum
CREATE TYPE shop_item_type AS ENUM ('coupon', 'reward');

-- Shop item tier enum
CREATE TYPE shop_item_tier AS ENUM ('small', 'medium', 'large');

-- Price range enum for food options
CREATE TYPE price_range AS ENUM ('$', '$$', '$$$');

-- News headline type enum
CREATE TYPE headline_type AS ENUM ('static', 'dynamic');

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  google_id TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  CONSTRAINT unique_role UNIQUE (role)  -- only one meedo and one beedo
);

-- ============================================
-- PHOTOS TABLE
-- ============================================

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  storage_path TEXT,  -- path in supabase storage
  uploaded_by user_role NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  caption TEXT
);

CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at DESC);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);

-- ============================================
-- BOARDS TABLE (Sticker Boards)
-- ============================================

CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canvas_data JSONB DEFAULT '{"stickers": []}'::jsonb
);

CREATE INDEX idx_boards_updated_at ON boards(updated_at DESC);
CREATE INDEX idx_boards_created_by ON boards(created_by);

-- ============================================
-- EVENTS TABLE (Calendar)
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_event_id TEXT UNIQUE,  -- for google calendar sync
  title TEXT NOT NULL,
  type event_type NOT NULL DEFAULT 'hangout',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  description TEXT,
  created_by user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_google_id ON events(google_event_id);

-- ============================================
-- WISHES TABLE (Wishing Well)
-- ============================================

CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  wished_by user_role NOT NULL,
  wished_at TIMESTAMPTZ DEFAULT NOW(),
  status wish_status DEFAULT 'pending',
  status_note TEXT,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_wishes_status ON wishes(status);
CREATE INDEX idx_wishes_wished_at ON wishes(wished_at DESC);
CREATE INDEX idx_wishes_wished_by ON wishes(wished_by);

-- ============================================
-- COUPONS TABLE
-- ============================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  redeemed_by user_role
);

CREATE INDEX idx_coupons_redeemed ON coupons(redeemed);
CREATE INDEX idx_coupons_created_at ON coupons(created_at DESC);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);

-- ============================================
-- SHOP ITEMS TABLE
-- ============================================

CREATE TABLE shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type shop_item_type NOT NULL,
  price INTEGER NOT NULL,  -- in meedo coins
  tier shop_item_tier,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_items_type ON shop_items(type);
CREATE INDEX idx_shop_items_active ON shop_items(active);

-- ============================================
-- PURCHASES TABLE
-- ============================================

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES shop_items(id) ON DELETE SET NULL,
  purchased_by user_role NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  price_paid INTEGER NOT NULL,  -- record price at time of purchase
  fulfilled BOOLEAN DEFAULT FALSE,
  fulfilled_at TIMESTAMPTZ
);

CREATE INDEX idx_purchases_purchased_by ON purchases(purchased_by);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at DESC);
CREATE INDEX idx_purchases_fulfilled ON purchases(fulfilled);

-- ============================================
-- USER BALANCES TABLE (Coin Balances)
-- ============================================

CREATE TABLE user_balances (
  user_role user_role PRIMARY KEY,
  coins INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,  -- lifetime earned
  total_spent INTEGER DEFAULT 0,   -- lifetime spent
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize balances for both users
INSERT INTO user_balances (user_role, coins) VALUES ('meedo', 0), ('beedo', 0);

-- ============================================
-- BADGES TABLE
-- ============================================

CREATE TABLE badges (
  id TEXT PRIMARY KEY,  -- slug like 'first-visit', 'spelling-champ'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT  -- path to badge icon
);

-- ============================================
-- USER BADGES TABLE (Junction Table)
-- ============================================

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_role user_role NOT NULL,
  badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_badge UNIQUE (user_role, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_role);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- ============================================
-- NEWS HEADLINES TABLE
-- ============================================

CREATE TABLE news_headlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  type headline_type DEFAULT 'static',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_headlines_active ON news_headlines(active);
CREATE INDEX idx_headlines_type ON news_headlines(type);

-- ============================================
-- COUNTDOWNS TABLE
-- ============================================

CREATE TABLE countdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  target_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_countdowns_active ON countdowns(active);
CREATE INDEX idx_countdowns_target ON countdowns(target_date);

-- ============================================
-- FOOD OPTIONS TABLE
-- ============================================

CREATE TABLE food_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cuisine TEXT,
  price_range price_range,
  location TEXT,
  added_by user_role NOT NULL,
  weight INTEGER DEFAULT 1,  -- preference weight, higher = more likely
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_active ON food_options(active);
CREATE INDEX idx_food_cuisine ON food_options(cuisine);

-- ============================================
-- SEED DATA: DEFAULT BADGES
-- ============================================

INSERT INTO badges (id, name, description, icon) VALUES
  ('first-visit', 'First Visit', 'Entered the Meedobeedo world for the first time', '/badges/first-visit.svg'),
  ('5-day-streak', '5 Day Streak', 'Visited 5 days in a row', '/badges/streak-5.svg'),
  ('first-coupon', 'First Coupon', 'Redeemed your first coupon', '/badges/first-coupon.svg'),
  ('spelling-champ', 'Spelling Mee Champion', 'Scored 100 on Spelling Mee', '/badges/spelling-champ.svg'),
  ('memory-master', 'Memory Master', 'Completed Meedo Memory with no mistakes', '/badges/memory-master.svg'),
  ('big-spender', 'Big Spender', 'Spent 1000 coins in the shop', '/badges/big-spender.svg'),
  ('wish-granted', 'Wish Granted', 'Had your first wish granted by Mod', '/badges/wish-granted.svg'),
  ('photo-uploader', 'Shutterbug', 'Uploaded your first photo', '/badges/photo-uploader.svg'),
  ('board-creator', 'Board Creator', 'Created your first sticker board', '/badges/board-creator.svg'),
  ('jackpot', 'Jackpot!', 'Won the slot machine jackpot', '/badges/jackpot.svg');

-- ============================================
-- SEED DATA: SAMPLE HEADLINES
-- ============================================

INSERT INTO news_headlines (text, type, active) VALUES
  ('BREAKING: Beedo caught stealing snacks from national reserve', 'static', true),
  ('ECONOMY UPDATE: Coin inflation at 0%, economists baffled', 'static', true),
  ('WEATHER: Scattered cuddles expected throughout the week', 'static', true),
  ('LOCAL NEWS: New sticker discovered, nation celebrates', 'static', true),
  ('SPORTS: Meedo defeats Beedo in epic thumb war, 3-2', 'static', true);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables (but keep policies simple since it's just 2 users)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_headlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_options ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can do everything
-- (since we already gate access at the auth level with email whitelist + password)

CREATE POLICY "authenticated_access" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON boards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON wishes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON shop_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON user_balances FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON badges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON user_badges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON news_headlines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON countdowns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON food_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update coin balance (atomic transaction)
CREATE OR REPLACE FUNCTION update_coin_balance(
  p_user_role user_role,
  p_amount INTEGER,
  p_is_earning BOOLEAN DEFAULT TRUE
)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  IF p_is_earning THEN
    UPDATE user_balances
    SET
      coins = coins + p_amount,
      total_earned = total_earned + p_amount,
      updated_at = NOW()
    WHERE user_role = p_user_role
    RETURNING coins INTO new_balance;
  ELSE
    -- Spending - check if they have enough
    UPDATE user_balances
    SET
      coins = coins - p_amount,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
    WHERE user_role = p_user_role AND coins >= p_amount
    RETURNING coins INTO new_balance;

    IF new_balance IS NULL THEN
      RAISE EXCEPTION 'Insufficient coins';
    END IF;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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
