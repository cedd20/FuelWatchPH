-- Fix auth signup profile creation and backfill the admin account profile.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  fallback_username TEXT;
BEGIN
  base_username := lower(trim(BOTH '_' FROM regexp_replace(
    COALESCE(
      NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
      NULLIF(trim(new.raw_user_meta_data->>'username'), ''),
      split_part(new.email, '@', 1),
      'user'
    ),
    '[^a-zA-Z0-9_]+',
    '_',
    'g'
  )));

  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;

  fallback_username := base_username || '_' || substring(replace(new.id::text, '-', ''), 1, 8);

  BEGIN
    INSERT INTO public.user_profiles (
      id,
      username,
      reputation,
      role,
      accuracy,
      bio,
      avatar_url,
      is_verified,
      user_type
    )
    VALUES (
      new.id,
      base_username,
      0,
      'user',
      0,
      NULL,
      NULL,
      FALSE,
      1
    );
  EXCEPTION
    WHEN unique_violation THEN
      BEGIN
        INSERT INTO public.user_profiles (
          id,
          username,
          reputation,
          role,
          accuracy,
          bio,
          avatar_url,
          is_verified,
          user_type
        )
        VALUES (
          new.id,
          fallback_username,
          0,
          'user',
          0,
          NULL,
          NULL,
          FALSE,
          1
        );
      EXCEPTION
        WHEN unique_violation THEN
          INSERT INTO public.user_profiles (
            id,
            username,
            reputation,
            role,
            accuracy,
            bio,
            avatar_url,
            is_verified,
            user_type
          )
          VALUES (
            new.id,
            fallback_username || '_' || substring(replace(new.id::text, '-', ''), 9, 4),
            0,
            'user',
            0,
            NULL,
            NULL,
            FALSE,
            1
          );
      END;
  END;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
  target_user RECORD;
  base_username TEXT;
  fallback_username TEXT;
BEGIN
  SELECT id, email
  INTO target_user
  FROM auth.users
  WHERE lower(email) = lower('admin@fuelwatch.ph')
  LIMIT 1;

  IF target_user.id IS NULL THEN
    RETURN;
  END IF;

  base_username := lower(trim(BOTH '_' FROM regexp_replace(
    COALESCE(NULLIF(split_part(target_user.email, '@', 1), ''), 'admin'),
    '[^a-zA-Z0-9_]+',
    '_',
    'g'
  )));
  fallback_username := base_username || '_' || substring(replace(target_user.id::text, '-', ''), 1, 8);

  BEGIN
    INSERT INTO public.user_profiles (
      id,
      username,
      reputation,
      role,
      accuracy,
      bio,
      avatar_url,
      is_verified,
      user_type
    )
    VALUES (
      target_user.id,
      base_username,
      0,
      'admin',
      0,
      NULL,
      NULL,
      TRUE,
      0
    )
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      role = EXCLUDED.role,
      user_type = EXCLUDED.user_type;
  EXCEPTION
    WHEN unique_violation THEN
      INSERT INTO public.user_profiles (
        id,
        username,
        reputation,
        role,
        accuracy,
        bio,
        avatar_url,
        is_verified,
        user_type
      )
      VALUES (
        target_user.id,
        fallback_username,
        0,
        'admin',
        0,
        NULL,
        NULL,
        TRUE,
        0
      )
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type;
  END;
END;
$$;