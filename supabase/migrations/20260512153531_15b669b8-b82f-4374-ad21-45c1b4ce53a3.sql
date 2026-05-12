
DROP POLICY IF EXISTS "custom achievements readable" ON public.custom_achievements;
DROP POLICY IF EXISTS "admins manage custom achievements" ON public.custom_achievements;
CREATE POLICY "custom achievements readable" ON public.custom_achievements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage custom achievements" ON public.custom_achievements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_adjust_points(_target uuid, _delta integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); new_total integer; uname text;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  IF _delta IS NULL OR _delta = 0 OR _delta < -100000 OR _delta > 100000 THEN RAISE EXCEPTION 'invalid delta'; END IF;
  UPDATE public.profiles SET points = GREATEST(0, points + _delta)
    WHERE id = _target RETURNING points INTO new_total;
  SELECT username INTO uname FROM public.profiles WHERE id = uid;
  INSERT INTO public.activity (user_id, username, type, detail)
    VALUES (uid, COALESCE(uname,'?'), 'admin-adjust-points',
            _target::text || ' (' || (CASE WHEN _delta > 0 THEN '+' ELSE '' END) || _delta::text ||
            CASE WHEN _reason IS NOT NULL THEN ' ' || _reason ELSE '' END || ')');
  RETURN new_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_achievement(_target uuid, _id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  UPDATE public.profiles
    SET achievements_discovered = CASE WHEN achievements_discovered ? _id
                                       THEN achievements_discovered
                                       ELSE achievements_discovered || to_jsonb(_id) END
    WHERE id = _target;
  INSERT INTO public.activity (user_id, username, type, detail)
    SELECT uid, p.username, 'admin-grant-ach', _target::text || ' ' || _id
    FROM public.profiles p WHERE p.id = uid;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_achievement(_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uname text;
  reward integer;
  discovered jsonb;
  claimed jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  reward := CASE _id
    WHEN 'konami' THEN 100 WHEN 'rosebud' THEN 100 WHEN 'leothelegend' THEN 100
    WHEN 'jasonking' THEN 150 WHEN 'four_corners' THEN 100 WHEN 'midnight_owl' THEN 250
    WHEN 'speed_clicker' THEN 75 WHEN 'logo_triple_click' THEN 50 WHEN 'ghost_idle' THEN 75
    WHEN 'whisper_iceman' THEN 50 WHEN 'shop_curious' THEN 25
    WHEN 'jumpscare_survivor' THEN 150 WHEN 'app_collector' THEN 200
    ELSE NULL END;
  IF reward IS NULL THEN
    SELECT c.reward INTO reward FROM public.custom_achievements c WHERE c.id = _id;
  END IF;
  IF reward IS NULL THEN RAISE EXCEPTION 'unknown achievement'; END IF;
  SELECT achievements_discovered, achievements_claimed, username
    INTO discovered, claimed, uname
    FROM public.profiles WHERE id = uid FOR UPDATE;
  IF NOT (discovered ? _id) THEN RAISE EXCEPTION 'not discovered yet'; END IF;
  IF claimed ? _id THEN RAISE EXCEPTION 'already claimed'; END IF;
  UPDATE public.profiles
    SET achievements_claimed = achievements_claimed || to_jsonb(_id),
        points = points + reward
    WHERE id = uid;
  INSERT INTO public.activity (user_id, username, type, detail)
    VALUES (uid, COALESCE(uname,'?'), 'achievement-claim', _id || ' (+' || reward || ')');
  RETURN jsonb_build_object('ok', true, 'reward', reward);
END;
$$;
