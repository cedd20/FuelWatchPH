-- blank seed file for template

-- Canonical fuel types used by the application. If you store these as
-- literal strings in the DB, create a migration to rename old values to
-- the new canonical names (see migration 005_fuel_type_abbreviations.sql).
-- Fuel types:
-- UL91
-- PR95
-- PR97
-- DSL
-- PDSL
-- Kerosene

-- Admin moderation tables and the per-user ban status policy are created in
-- backend/supabase/migrations/012_admin_moderation_tables.sql and
-- backend/supabase/migrations/013_users_can_read_own_ban_status.sql.
-- No default seed rows are required for:
-- station_reports
-- admin_bans
-- admin_activity_log
-- admin_settings

