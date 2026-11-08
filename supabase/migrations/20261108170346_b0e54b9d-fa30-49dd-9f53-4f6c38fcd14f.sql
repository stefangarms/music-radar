REVOKE ALL ON public.pairs, public.presence, public.current_media FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.pairs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presence TO authenticated;
GRANT ALL ON public.pairs, public.presence, public.current_media TO service_role;