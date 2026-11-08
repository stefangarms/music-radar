BEGIN;

-- Bestehende Profile und bisherige UI-Spalten erhalten.
ALTER TABLE public.profiles
  ADD COLUMN alias text NOT NULL DEFAULT '',
  ADD COLUMN bio text,
  ADD COLUMN genres text[] NOT NULL DEFAULT '{}',
  ADD COLUMN top_artists jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN top_artists_imported_at timestamptz,
  ADD COLUMN show_top_artists boolean NOT NULL DEFAULT false;

REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Die vorhandenen owner-only SELECT/UPDATE-Policies bleiben bestehen.
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE FUNCTION public.validate_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.alias IS NULL OR char_length(NEW.alias) > 30 THEN
    RAISE EXCEPTION 'Alias darf maximal 30 Zeichen enthalten.';
  END IF;
  IF NEW.bio IS NOT NULL AND char_length(NEW.bio) > 200 THEN
    RAISE EXCEPTION 'Bio darf maximal 200 Zeichen enthalten.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_profile_fields()
  FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profiles_validate_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_fields();

CREATE TABLE public.pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_a boolean NOT NULL DEFAULT false,
  consent_b boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pairs TO authenticated;
GRANT ALL ON public.pairs TO service_role;
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY pairs_read_participants ON public.pairs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (user_a, user_b));

CREATE TABLE public.presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy_m real NOT NULL,
  observed_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presence TO authenticated;
GRANT ALL ON public.presence TO service_role;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY presence_read_own ON public.presence
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY presence_insert_own ON public.presence
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY presence_update_own ON public.presence
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY presence_delete_own ON public.presence
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE FUNCTION public.presence_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.presence_set_updated_at()
  FROM PUBLIC, anon, authenticated;
CREATE TRIGGER presence_updated_at
  BEFORE UPDATE ON public.presence
  FOR EACH ROW EXECUTE FUNCTION public.presence_set_updated_at();

CREATE TABLE public.current_media (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'spotify',
  state text NOT NULL,
  title text,
  artist text,
  url text,
  observed_at timestamptz NOT NULL
);
GRANT ALL ON public.current_media TO service_role;
ALTER TABLE public.current_media ENABLE ROW LEVEL SECURITY;
-- Bewusst keine Policies für anon/authenticated.

-- Vorhandener Signup-Trigger verwendet dieselbe Funktion.
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_user_profile()
  FROM PUBLIC, anon, authenticated;

-- App-eigener Auth-Lifecycle-Trigger, keine Änderung an Auth-Spalten.
CREATE TRIGGER music_radar_profile_on_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS NOT NULL
    AND NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION public.create_user_profile();

COMMIT;