-- ─────────────────────────────────────────────────────────────────
-- Migration: 002_create_user_data_tables
-- Run in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ─────────────────────────────────────────────────────────────────

-- ── 1. MEDICINES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medicines (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  dosage       TEXT,                        -- e.g. "500mg"
  time_of_day  TEXT,                        -- e.g. "Morning", "Night"
  frequency    TEXT        DEFAULT 'Daily', -- e.g. "Daily", "Twice a day"
  notes        TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medicines"
  ON public.medicines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 2. APPOINTMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name     TEXT        NOT NULL,
  specialty       TEXT,                    -- e.g. "Cardiology"
  location        TEXT,
  appointment_at  TIMESTAMPTZ NOT NULL,    -- full date + time
  notes           TEXT,
  is_completed    BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own appointments"
  ON public.appointments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. REMINDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reminders (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  remind_at    TIMESTAMPTZ NOT NULL,
  is_done      BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reminders"
  ON public.reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 4. COMMUNITY EVENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  description  TEXT,
  location     TEXT,
  event_at     TIMESTAMPTZ NOT NULL,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community events are readable by all authenticated users
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view events"
  ON public.community_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users manage own events"
  ON public.community_events FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ── 5. SAMPLE DATA (optional - remove in production) ─────────────
-- INSERT INTO public.medicines (user_id, name, dosage, time_of_day, frequency)
-- VALUES (auth.uid(), 'Metformin', '500mg', 'Morning', 'Daily');
--
-- INSERT INTO public.appointments (user_id, doctor_name, specialty, appointment_at)
-- VALUES (auth.uid(), 'Dr. Sharma', 'Cardiology', now() + interval '2 days');
--
-- INSERT INTO public.reminders (user_id, title, remind_at)
-- VALUES (auth.uid(), 'Evening Walk', now() + interval '5 hours');
--
-- INSERT INTO public.community_events (title, location, event_at, created_by)
-- VALUES ('Morning Yoga', 'Central Park', now() + interval '1 day', auth.uid());
