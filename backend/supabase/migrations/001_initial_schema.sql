-- Run this file manually using the Supabase SQL editor or psql.
-- Do NOT auto-run from application code.

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  amenities TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price reports table (user-submitted)
CREATE TABLE IF NOT EXISTS price_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN (
    'Unleaded 91', 'Unleaded 95', 'Unleaded 98',
    'Diesel', 'Premium Diesel', 'Kerosene'
  )),
  price NUMERIC(8,2) NOT NULL CHECK (price >= 40 AND price <= 200),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  reported_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  confirmation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price verifications (anonymous confirmations)
CREATE TABLE IF NOT EXISTS price_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_report_id UUID NOT NULL REFERENCES price_reports(id),
  ip_hash TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(price_report_id, ip_hash)
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  reputation INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Stations
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active stations" ON stations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Authenticated users can insert stations" ON stations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners and mods can update stations" ON stations FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);

-- RLS: Price reports
ALTER TABLE price_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active price reports" ON price_reports FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Authenticated users can insert price reports" ON price_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners and mods can update price reports" ON price_reports FOR UPDATE USING (
  reported_by = auth.uid() OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
);

-- RLS: Price verifications (anonymous allowed)
ALTER TABLE price_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert verifications" ON price_verifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can read verifications" ON price_verifications FOR SELECT USING (TRUE);

-- RLS: User profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());
