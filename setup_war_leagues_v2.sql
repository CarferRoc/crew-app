-- 1. Create separate table for WAR LEAGUES
CREATE TABLE IF NOT EXISTS public.war_leagues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    level int NOT NULL UNIQUE,
    description text,
    code text,
    min_points int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 2. Populate with the War Leagues hierarchy (Updated Names)
INSERT INTO public.war_leagues (name, level, description, code) VALUES
('Liga Asfalto', 1, 'Entry level', 'L1_ASF'),
('Liga Pista', 2, 'Junior level', 'L2_PST'),
('Liga Track', 3, 'Intermediate level', 'L3_TRK'),
('Liga Motor', 4, 'Advanced level', 'L4_MTR'),
('Liga Racing', 5, 'Pro level', 'L5_RCG'),
('Liga Circuito', 6, 'Expert level', 'L6_CIR'),
('Liga Velocidad', 7, 'Elite level', 'L7_VEL')
ON CONFLICT (level) DO UPDATE SET 
    name = EXCLUDED.name,
    code = EXCLUDED.code;

-- 3. Update Crews Table to reference new table
ALTER TABLE public.crews 
DROP COLUMN IF EXISTS league_id; -- Cleanup old column if exists

ALTER TABLE public.crews
ADD COLUMN IF NOT EXISTS war_league_id uuid REFERENCES public.war_leagues(id);

-- 4. Initialize all crews to Level 1 War League (Liga Asfalto)
DO $$
DECLARE
    v_starter_league_id uuid;
BEGIN
    SELECT id INTO v_starter_league_id FROM public.war_leagues WHERE level = 1 LIMIT 1;
    
    IF v_starter_league_id IS NOT NULL THEN
        UPDATE public.crews
        SET war_league_id = v_starter_league_id
        WHERE war_league_id IS NULL;
    END IF;
END $$;
