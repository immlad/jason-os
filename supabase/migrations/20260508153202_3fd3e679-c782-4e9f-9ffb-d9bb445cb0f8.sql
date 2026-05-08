
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shop_unlocks jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Update has_role to ignore expired roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Award points (callable by the user for themselves)
CREATE OR REPLACE FUNCTION public.award_points(_amount integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_total integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 500 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;
  UPDATE public.profiles SET points = points + _amount WHERE id = uid
    RETURNING points INTO new_total;
  INSERT INTO public.activity (user_id, username, type, detail)
    SELECT uid, username, 'points-earn', _amount::text || ' (' || COALESCE(_reason,'') || ')'
    FROM public.profiles WHERE id = uid;
  RETURN new_total;
END;
$$;

-- Server-validated purchase
CREATE OR REPLACE FUNCTION public.purchase_item(_item text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  price integer;
  uname text;
  cur_unlocks jsonb;
  cur_points integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  price := CASE _item
    WHEN 'theme_sebastian' THEN 500
    WHEN 'theme_leo' THEN 500
    WHEN 'theme_jasoncat' THEN 1500
    WHEN 'theme_night' THEN 200
    WHEN 'theme_forest' THEN 200
    WHEN 'theme_jason' THEN 300
    WHEN 'wallpaper_pack' THEN 800
    WHEN 'custom_font_slot' THEN 400
    WHEN 'admin_3_days' THEN 5000
    ELSE NULL
  END;

  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;

  SELECT points, shop_unlocks, username INTO cur_points, cur_unlocks, uname
    FROM public.profiles WHERE id = uid FOR UPDATE;

  IF cur_points < price THEN RAISE EXCEPTION 'not enough points'; END IF;

  -- prevent re-buying owned items (admin is repeatable / extends time)
  IF _item <> 'admin_3_days' AND cur_unlocks ? _item THEN
    RAISE EXCEPTION 'already owned';
  END IF;

  UPDATE public.profiles
    SET points = points - price,
        shop_unlocks = CASE WHEN shop_unlocks ? _item THEN shop_unlocks
                            ELSE shop_unlocks || to_jsonb(_item) END,
        sebastian_unlocked = sebastian_unlocked OR _item = 'theme_sebastian',
        leo_unlocked       = leo_unlocked OR _item = 'theme_leo',
        jasoncat_unlocked  = jasoncat_unlocked OR _item = 'theme_jasoncat'
    WHERE id = uid;

  IF _item = 'admin_3_days' THEN
    -- extend if existing temp admin, else insert new
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin') THEN
      UPDATE public.user_roles
         SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + interval '3 days'
       WHERE user_id = uid AND role = 'admin';
    ELSE
      INSERT INTO public.user_roles (user_id, role, expires_at)
        VALUES (uid, 'admin', now() + interval '3 days');
    END IF;
  END IF;

  INSERT INTO public.activity (user_id, username, type, detail)
    VALUES (uid, COALESCE(uname,'?'), 'shop-purchase', _item || ' (-' || price || ')');

  RETURN jsonb_build_object('ok', true, 'item', _item, 'price', price, 'remaining', cur_points - price);
END;
$$;

REVOKE ALL ON FUNCTION public.award_points(integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.award_points(integer, text) TO authenticated;
REVOKE ALL ON FUNCTION public.purchase_item(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.purchase_item(text) TO authenticated;
