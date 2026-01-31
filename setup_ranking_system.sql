-- 1. Create Leagues Table (Adapt to existing schema if needed)
CREATE TABLE IF NOT EXISTS public.leagues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    code text NOT NULL, -- Added based on previous error
    created_at timestamptz DEFAULT now()
);

-- Ensure columns exist
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS level int;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS code text;

-- FORCE Uniqueness Constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leagues_name_key') THEN
        ALTER TABLE public.leagues ADD CONSTRAINT leagues_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leagues_level_key') THEN
        ALTER TABLE public.leagues ADD CONSTRAINT leagues_level_key UNIQUE (level);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leagues_code_key') THEN
        ALTER TABLE public.leagues ADD CONSTRAINT leagues_code_key UNIQUE (code);
    END IF;
END $$;


-- 2. Seed Leagues
INSERT INTO public.leagues (name, level, description, code) VALUES
('Asphalt Aspirants', 1, 'The entry point. Garage builds and raw potential.', 'L1_ASP'),
('Street Spec', 2, 'Proven street teams organizing for the next level.', 'L2_STR'),
('Midnight Runners', 3, 'The bridge between street and pro. Serious tuners.', 'L3_MID'),
('Tarmac Titans', 4, 'Established clans with recognized skill and recognized builds.', 'L4_TAR'),
('Apex Predators', 5, 'Dominant track-focused clans with serious competitive history.', 'L5_APX'),
('Velocity Vanguard', 6, 'Professional grade teams with high-performance builds.', 'L6_VEL'),
('The Summit', 7, 'The absolute elite. The gods of the asphalt.', 'L7_SUM')
ON CONFLICT (name) DO UPDATE SET 
    level = EXCLUDED.level,
    description = EXCLUDED.description,
    code = EXCLUDED.code;

-- 3. Update Crews Table
-- FIX: Explicitly handle the wrong type (int) if it was created by my bad script.
DO $$
BEGIN
    -- If league_id exists and is NOT uuid (e.g. integer), drop it.
    -- We can just try to drop it if it is integer, or stricter check.
    -- Easiest: If strict type check shows int, drop.
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'crews' 
          AND column_name = 'league_id' 
          AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.crews DROP COLUMN league_id;
    END IF;
END $$;

ALTER TABLE public.crews 
ADD COLUMN IF NOT EXISTS league_id uuid REFERENCES public.leagues(id),
ADD COLUMN IF NOT EXISTS total_season_points int DEFAULT 0;

-- 4. Create Clan War Events Table
CREATE TABLE IF NOT EXISTS public.clan_war_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    event_date date NOT NULL,
    status text DEFAULT 'pending', -- 'pending', 'active', 'completed'
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 5. Create Event Participations (Scores per Clan)
CREATE TABLE IF NOT EXISTS public.event_participations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES public.clan_war_events(id) ON DELETE CASCADE,
    crew_id uuid REFERENCES public.crews(id) ON DELETE CASCADE,
    total_score numeric DEFAULT 0,
    rank int, -- Final rank in this specific event
    bonus_points int DEFAULT 0, -- e.g. Best Car Bonus
    created_at timestamptz DEFAULT now(),
    UNIQUE(event_id, crew_id)
);

-- 6. Create Car Evaluations (Individual Car Scores)
CREATE TABLE IF NOT EXISTS public.car_evaluations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES public.clan_war_events(id) ON DELETE CASCADE,
    crew_id uuid REFERENCES public.crews(id) ON DELETE CASCADE,
    member_id uuid REFERENCES auth.users(id), -- The owner of the car
    car_name text,
    car_image_url text,
    score_aesthetics numeric CHECK (score_aesthetics BETWEEN 0 AND 10),
    score_power numeric CHECK (score_power BETWEEN 0 AND 10),
    score_sound numeric CHECK (score_sound BETWEEN 0 AND 10),
    score_x_factor numeric CHECK (score_x_factor BETWEEN 0 AND 10),
    admin_notes text,
    created_at timestamptz DEFAULT now()
);

-- 7. RLS Policies

-- Leagues
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Leagues" ON public.leagues;
CREATE POLICY "Public Read Leagues" ON public.leagues FOR SELECT USING (true);

-- Clan War Events
ALTER TABLE public.clan_war_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Events" ON public.clan_war_events;
CREATE POLICY "Public Read Events" ON public.clan_war_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Insert Events" ON public.clan_war_events;
CREATE POLICY "Admin Insert Events" ON public.clan_war_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Update Events" ON public.clan_war_events;
CREATE POLICY "Admin Update Events" ON public.clan_war_events FOR UPDATE USING (auth.role() = 'authenticated');

-- Participations
ALTER TABLE public.event_participations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Participations" ON public.event_participations;
CREATE POLICY "Public Read Participations" ON public.event_participations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Participations" ON public.event_participations;
CREATE POLICY "Admin Manage Participations" ON public.event_participations FOR ALL USING (auth.role() = 'authenticated');

-- Car Evaluations
ALTER TABLE public.car_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Evaluations" ON public.car_evaluations;
CREATE POLICY "Public Read Evaluations" ON public.car_evaluations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Evaluations" ON public.car_evaluations;
CREATE POLICY "Admin Manage Evaluations" ON public.car_evaluations FOR ALL USING (auth.role() = 'authenticated');
