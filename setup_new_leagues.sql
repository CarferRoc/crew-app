-- 1. Create New Leagues Table
CREATE TABLE IF NOT EXISTS public.competition_leagues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    code text NOT NULL UNIQUE,
    level int NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

-- 2. Seed Leagues (The 7 tiers)
INSERT INTO public.competition_leagues (name, level, description, code) VALUES
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

-- 3. Update Crews to point to new leagues
-- We will add a NEW column to avoid breaking the old 'leagues' if it's used elsewhere
ALTER TABLE public.crews 
ADD COLUMN IF NOT EXISTS competition_league_id uuid REFERENCES public.competition_leagues(id);

-- 4. RLS
ALTER TABLE public.competition_leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Comp Leagues" ON public.competition_leagues FOR SELECT USING (true);
