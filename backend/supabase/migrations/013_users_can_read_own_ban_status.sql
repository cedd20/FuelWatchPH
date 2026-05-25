-- Migration 013: Allow users to read only their own moderation status

DROP POLICY IF EXISTS "Users can read own ban status" ON public.admin_bans;
CREATE POLICY "Users can read own ban status"
  ON public.admin_bans
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
