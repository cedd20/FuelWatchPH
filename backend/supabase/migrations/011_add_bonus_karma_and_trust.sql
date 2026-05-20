-- Migration 011: Add bonus_karma and bonus_trust columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bonus_karma INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bonus_trust INTEGER DEFAULT 0;
