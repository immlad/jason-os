
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS achievements_discovered jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS achievements_claimed jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.discover_achievement(_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uname text;
  discovered jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT achievements_discovered, username INTO discovered, uname
    FROM public.profiles WHERE id = uid FOR UPDATE;
  IF discovered ? _id THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;
  UPDATE public.profiles
    SET achievements_discovered = achievements_discovered || to_jsonb(_id)
    WHERE id = uid;
  INSERT INTO public.activity (user_id, username, type, detail)
    VALUES (uid, COALESCE(uname,'?'), 'achievement-found', _id);
  RETURN jsonb_build_object('ok', true, 'discovered', _id);
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
    WHEN 'konami'             THEN 100
    WHEN 'rosebud'            THEN 100
    WHEN 'leothelegend'       THEN 100
    WHEN 'jasonking'          THEN 150
    WHEN 'four_corners'       THEN 100
    WHEN 'midnight_owl'       THEN 250
    WHEN 'speed_clicker'      THEN 75
    WHEN 'logo_triple_click'  THEN 50
    WHEN 'ghost_idle'         THEN 75
    WHEN 'whisper_iceman'     THEN 50
    WHEN 'shop_curious'       THEN 25
    WHEN 'jumpscare_survivor' THEN 150
    WHEN 'app_collector'      THEN 200
    ELSE NULL
  END;
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

CREATE OR REPLACE FUNCTION public.admin_reset_points(_target uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  UPDATE public.profiles SET points = 0 WHERE id = _target;
  INSERT INTO public.activity (user_id, username, type, detail)
    SELECT uid, p.username, 'admin-reset-points', _target::text
    FROM public.profiles p WHERE p.id = uid;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_troll_cap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.troll_events
    WHERE target_id = NEW.target_id AND dismissed = false;
  IF n >= 10 THEN
    RAISE EXCEPTION 'jumpscare cap reached (10 active for this user)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS troll_events_cap ON public.troll_events;
CREATE TRIGGER troll_events_cap
  BEFORE INSERT ON public.troll_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_troll_cap();
