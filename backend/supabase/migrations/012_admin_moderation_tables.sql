-- Migration 012: Admin moderation tables

CREATE TABLE IF NOT EXISTS public.station_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  station_name TEXT NOT NULL,
  station_address TEXT,
  report_type TEXT NOT NULL,
  description TEXT,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  reason TEXT NOT NULL,
  reason_label TEXT NOT NULL,
  notes TEXT,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  banned_by_name TEXT,
  ban_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  unbanned_at TIMESTAMPTZ,
  unbanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  unbanned_by_name TEXT,
  unban_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  action_title TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  target_id TEXT,
  target_name TEXT,
  action_note TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  admin_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_view TEXT NOT NULL DEFAULT 'dashboard',
  items_per_page INTEGER NOT NULL DEFAULT 25,
  auto_refresh BOOLEAN NOT NULL DEFAULT TRUE,
  refresh_interval INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS station_reports_status_created_at_idx
  ON public.station_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS station_reports_station_id_idx
  ON public.station_reports (station_id);

CREATE INDEX IF NOT EXISTS admin_bans_active_ban_date_idx
  ON public.admin_bans (is_active, ban_date DESC);

CREATE INDEX IF NOT EXISTS admin_bans_user_id_idx
  ON public.admin_bans (user_id);

CREATE INDEX IF NOT EXISTS admin_activity_log_action_type_created_at_idx
  ON public.admin_activity_log (action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_activity_log_actor_id_idx
  ON public.admin_activity_log (actor_id);

ALTER TABLE public.station_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert station reports" ON public.station_reports;
CREATE POLICY "Authenticated users can insert station reports"
  ON public.station_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

DROP POLICY IF EXISTS "Users can read own station reports" ON public.station_reports;
CREATE POLICY "Users can read own station reports"
  ON public.station_reports
  FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

DROP POLICY IF EXISTS "Admins can manage station reports" ON public.station_reports;
CREATE POLICY "Admins can manage station reports"
  ON public.station_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid() AND (user_type = 0 OR role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid() AND (user_type = 0 OR role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage bans" ON public.admin_bans;
CREATE POLICY "Admins can manage bans"
  ON public.admin_bans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid() AND (user_type = 0 OR role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid() AND (user_type = 0 OR role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can manage activity log"
  ON public.admin_activity_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid() AND (user_type = 0 OR role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid() AND (user_type = 0 OR role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage own settings" ON public.admin_settings;
CREATE POLICY "Admins can manage own settings"
  ON public.admin_settings
  FOR ALL
  TO authenticated
  USING (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid() AND (user_type = 0 OR role = 'admin')
    )
  )
  WITH CHECK (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid() AND (user_type = 0 OR role = 'admin')
    )
  );
