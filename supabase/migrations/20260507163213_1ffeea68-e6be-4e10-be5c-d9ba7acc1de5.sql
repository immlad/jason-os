ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS screen_locked boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS screen_lock_message text;