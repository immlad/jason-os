
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles readable by authenticated" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  theme TEXT NOT NULL DEFAULT 'cloud',
  custom_wallpaper TEXT,
  custom_font JSONB,
  custom_jumpscare TEXT,
  web_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
  pinned_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
  dock_side TEXT NOT NULL DEFAULT 'bottom',
  dock_shape TEXT NOT NULL DEFAULT 'pill',
  dock_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  desktop_icons JSONB NOT NULL DEFAULT '{}'::jsonb,
  sebastian_unlocked BOOLEAN NOT NULL DEFAULT false,
  leo_unlocked BOOLEAN NOT NULL DEFAULT false,
  jasoncat_unlocked BOOLEAN NOT NULL DEFAULT false,
  banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable to all auth" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto profile + admin trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uname TEXT;
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1));
  INSERT INTO public.profiles (id, username) VALUES (NEW.id, uname)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  IF lower(uname) IN ('jason','minh') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Global messages
CREATE TABLE public.global_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user TEXT NOT NULL,
  from_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msgs readable" ON public.global_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin send msgs" ON public.global_messages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND from_id = auth.uid());

-- Troll events
CREATE TABLE public.troll_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.troll_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trolls visible to target or admin" ON public.troll_events
  FOR SELECT TO authenticated USING (target_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin send troll" ON public.troll_events
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "target dismisses troll" ON public.troll_events
  FOR UPDATE TO authenticated USING (target_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Presence
CREATE TABLE public.presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  current_app TEXT,
  route TEXT,
  mouse_x INT,
  mouse_y INT,
  viewport_w INT,
  viewport_h INT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presence readable" ON public.presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "users upsert own presence" ON public.presence FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own presence" ON public.presence FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users delete own presence" ON public.presence FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Activity
CREATE TABLE public.activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  type TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity readable" ON public.activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own activity" ON public.activity FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.troll_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

ALTER TABLE public.global_messages REPLICA IDENTITY FULL;
ALTER TABLE public.troll_events REPLICA IDENTITY FULL;
ALTER TABLE public.presence REPLICA IDENTITY FULL;
ALTER TABLE public.activity REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
