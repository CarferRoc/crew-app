-- =========================================================================================
-- SYSTEM SETUP: WARS, LEAGUES & RANKINGS (CITY-BASED) v2
-- =========================================================================================

-- 1. ENHANCE LEAGUES TABLE
CREATE TABLE IF NOT EXISTS public.leagues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    level int NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

INSERT INTO public.leagues (name, level, description, code) VALUES
('Liga Octano Rojo', 1, 'Entry level', 'L1_OCT'),
('Liga Apex Torque', 2, 'Junior level', 'L2_APX'),
('Liga V8 Élite', 3, 'Intermediate level', 'L3_V8'),
('Liga Turbo Nexus', 4, 'Advanced level', 'L4_NBC'),
('Liga Paddock Prime', 5, 'Pro level', 'L5_PDF'),
('Liga Overdrive', 6, 'Expert level', 'L6_OVR'),
('Liga Línea de Corte', 7, 'Elite level', 'L7_CUT')
ON CONFLICT (level) DO UPDATE SET 
    name = EXCLUDED.name,
    code = EXCLUDED.code;


-- 2. ENHANCE CREWS TABLE
ALTER TABLE public.crews 
ADD COLUMN IF NOT EXISTS is_participating boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS boosters_available int DEFAULT 2,
ADD COLUMN IF NOT EXISTS last_booster_used_at timestamptz,
ADD COLUMN IF NOT EXISTS city text; 


-- 3. CREATE WARS TABLE
CREATE TABLE IF NOT EXISTS public.wars (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'voting', 'completed')),
    is_multiguerra boolean DEFAULT false, -- True during initial phase
    created_at timestamptz DEFAULT now()
);

-- Ensure name column exists (in case table existed without it)
ALTER TABLE public.wars ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.wars ADD COLUMN IF NOT EXISTS start_time timestamptz DEFAULT now();
ALTER TABLE public.wars ADD COLUMN IF NOT EXISTS end_time timestamptz DEFAULT now() + interval '30 days';
ALTER TABLE public.wars ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'voting', 'completed'));
ALTER TABLE public.wars ADD COLUMN IF NOT EXISTS is_multiguerra boolean DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS only_one_active_war 
ON public.wars (status) 
WHERE (status = 'active' OR status = 'voting');


-- 4. WAR ENTRIES 
CREATE TABLE IF NOT EXISTS public.war_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    war_id uuid REFERENCES public.wars(id) ON DELETE CASCADE,
    crew_id uuid REFERENCES public.crews(id) ON DELETE CASCADE,
    car_id uuid, 
    member_id uuid REFERENCES auth.users(id), 
    car_photo_url text, 
    total_score numeric DEFAULT 0,
    rank int, 
    city text, 
    group_id uuid, -- For Multiguerra partitioning
    used_booster boolean DEFAULT false, -- Specific for this war
    created_at timestamptz DEFAULT now(),
    UNIQUE(war_id, crew_id) 
);

-- Constraint: "Líderes" crew cannot participate
CREATE OR REPLACE FUNCTION check_lideres_exclusion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.crews 
        WHERE id = NEW.crew_id AND name = 'Líderes'
    ) THEN
        RAISE EXCEPTION 'The "Líderes" crew cannot participate in wars.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_lideres_exclusion ON public.war_entries;
CREATE TRIGGER trigger_check_lideres_exclusion
BEFORE INSERT ON public.war_entries
FOR EACH ROW EXECUTE FUNCTION check_lideres_exclusion();


-- 5. WAR VOTES
CREATE TABLE IF NOT EXISTS public.war_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    war_id uuid REFERENCES public.wars(id) ON DELETE CASCADE,
    entry_id uuid REFERENCES public.war_entries(id) ON DELETE CASCADE,
    admin_id uuid REFERENCES auth.users(id),
    score int CHECK (score >= 1 AND score <= 10),
    created_at timestamptz DEFAULT now(),
    UNIQUE(war_id, entry_id, admin_id)
);


-- 6. FUNCTIONS

-- A. Start War
CREATE OR REPLACE FUNCTION start_war(war_name text, is_multi boolean)
RETURNS uuid AS $$
DECLARE
    new_war_id uuid;
BEGIN
    IF EXISTS (SELECT 1 FROM public.wars WHERE status IN ('active', 'voting')) THEN
        RAISE EXCEPTION 'Current war must be completed before starting a new one.';
    END IF;

    INSERT INTO public.wars (name, start_time, end_time, status, is_multiguerra)
    VALUES (war_name, now(), now() + interval '30 days', 'active', is_multi)
    RETURNING id INTO new_war_id;
    
    RETURN new_war_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- B. Submit Vote
CREATE OR REPLACE FUNCTION submit_war_vote(p_war_id uuid, p_entry_id uuid, p_score int)
RETURNS void AS $$
BEGIN
    -- Check admin role
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Only admins can vote.';
    END IF;

    INSERT INTO public.war_votes (war_id, entry_id, admin_id, score)
    VALUES (p_war_id, p_entry_id, auth.uid(), p_score)
    ON CONFLICT (war_id, entry_id, admin_id) 
    DO UPDATE SET score = EXCLUDED.score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- C. End War & Calculate Results (THE BIG ONE)
CREATE OR REPLACE FUNCTION end_war(p_war_id uuid)
RETURNS void AS $$
DECLARE
    v_crew_record RECORD;
    v_war RECORD;
    v_points int;
    v_bonus int;
    v_total_crews int;
BEGIN
    SELECT * INTO v_war FROM public.wars WHERE id = p_war_id;
    
    IF v_war.status NOT IN ('active', 'voting') THEN
       RAISE EXCEPTION 'War is not active/voting.';
    END IF;

    -- 1. Aggregate Scores
    UPDATE public.war_entries e
    SET total_score = (
        SELECT COALESCE(SUM(score), 0) 
        FROM public.war_votes v 
        WHERE v.entry_id = e.id
    )
    WHERE war_id = p_war_id;

    -- 2. Rank Entries
    -- If Multiguerra: Rank within group_id
    -- If Regular: Rank within city + current league level
    IF v_war.is_multiguerra THEN
        UPDATE public.war_entries e
        SET rank = sub.rnk
        FROM (
            SELECT e.id, RANK() OVER (PARTITION BY group_id ORDER BY total_score DESC) as rnk
            FROM public.war_entries e
            WHERE war_id = p_war_id
        ) sub
        WHERE e.id = sub.id;
    ELSE
         UPDATE public.war_entries e
        SET rank = sub.rnk
        FROM (
            SELECT e.id, RANK() OVER (
                PARTITION BY e.city, c.league_id 
                ORDER BY total_score DESC
            ) as rnk
            FROM public.war_entries e
            JOIN public.crews c ON e.crew_id = c.id
            WHERE e.war_id = p_war_id
        ) sub
        WHERE e.id = sub.id;
    END IF;

    -- 3. Distribute Rewards (Top 5)
    -- Logic applies regardless of Multiguerra/Regular for POINTS distribution
    FOR v_crew_record IN 
        SELECT * FROM public.war_entries 
        WHERE war_id = p_war_id AND rank <= 5
    LOOP
        v_points := CASE v_crew_record.rank
            WHEN 1 THEN 10
            WHEN 2 THEN 9
            WHEN 3 THEN 8
            WHEN 4 THEN 7
            WHEN 5 THEN 6
            ELSE 0
        END;

        -- Add points to all members
        UPDATE public.crew_members
        SET war_points = COALESCE(war_points, 0) + v_points
        WHERE crew_id = v_crew_record.crew_id;

        -- SYNC: Update User Profile Points for ALL members
        UPDATE public.profiles
        SET "pointsPersonal" = COALESCE("pointsPersonal", 0) + v_points
        WHERE id IN (
            SELECT profile_id FROM public.crew_members WHERE crew_id = v_crew_record.crew_id
        );

        -- Winning Car Bonus
        v_bonus := CASE v_crew_record.rank
            WHEN 1 THEN 10
            WHEN 2 THEN 9
            WHEN 3 THEN 8
            WHEN 4 THEN 7
            WHEN 5 THEN 6
            ELSE 0
        END;

        IF v_crew_record.member_id IS NOT NULL THEN
             UPDATE public.crew_members
             SET war_points = war_points + v_bonus
             WHERE crew_id = v_crew_record.crew_id AND profile_id = v_crew_record.member_id;

             -- SYNC: Update User Profile Points
             UPDATE public.profiles
             SET "pointsPersonal" = COALESCE("pointsPersonal", 0) + v_bonus
             WHERE id = v_crew_record.member_id;
        END IF;
    END LOOP;

    -- 4. Promotions / Relegations
    IF v_war.is_multiguerra THEN
        -- Multiguerra: Winner of each group ascends
        UPDATE public.crews c
        SET league_id = (SELECT id FROM public.leagues WHERE level = (
                SELECT level + 1 FROM public.leagues WHERE id = c.league_id
            ))
        FROM public.war_entries e
        WHERE e.crew_id = c.id 
          AND e.war_id = p_war_id 
          AND e.rank = 1
          AND EXISTS (
              SELECT 1 FROM public.leagues l_current 
              WHERE l_current.id = c.league_id AND l_current.level < 7
          ); -- Cap at level 7
    ELSE
        -- Regular: Top 3 up, Bottom 3 down
        -- UP (Rank <= 3)
        UPDATE public.crews c
        SET league_id = (SELECT id FROM public.leagues WHERE level = (
                SELECT level + 1 FROM public.leagues WHERE id = c.league_id
            ))
        FROM public.war_entries e
        WHERE e.crew_id = c.id 
          AND e.war_id = p_war_id 
          AND e.rank <= 3
          AND EXISTS (
              SELECT 1 FROM public.leagues l_current 
              WHERE l_current.id = c.league_id AND l_current.level < 7
          );

        -- DOWN (Bottom 3, unless booster used or lowest league)
        -- We need to know how many entries per specialized group (city + league)
        -- This is tricky in a single update. Let's loop or use complex CTE.
        -- Simpler: Mark for relegation in temp table or use a helper function.
        -- Or just assume 'Bottom 3' means rank > (count - 3).
        
        -- Let's iterate entries that are potential candidates for relegation
        -- Relegation Candidates: Rank > (Total - 3) AND NOT used_booster AND league_id > 1
        
        -- Need total count per partition.
        -- Let's do a loop for simplicity and safety.
        FOR v_crew_record IN 
            SELECT e.*, c.league_id, l.level as league_level, 
                   COUNT(*) OVER (PARTITION BY e.city, c.league_id) as total_entries
            FROM public.war_entries e
            JOIN public.crews c ON e.crew_id = c.id
            JOIN public.leagues l ON c.league_id = l.id
            WHERE e.war_id = p_war_id
        LOOP
            IF v_crew_record.league_level > 1 
               AND v_crew_record.used_booster = false 
               AND v_crew_record.rank > (v_crew_record.total_entries - 3) 
            THEN
                -- Relegate
                 UPDATE public.crews
                 SET league_id = (SELECT id FROM public.leagues WHERE level = v_crew_record.league_level - 1)
                 WHERE id = v_crew_record.crew_id;
            END IF;
        END LOOP;
        
    END IF;

    -- Mark War Completed
    UPDATE public.wars SET status = 'completed', end_time = now() WHERE id = p_war_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS POLICIES

-- Wars
ALTER TABLE public.wars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Wars Public Read" ON public.wars;
CREATE POLICY "Wars Public Read" ON public.wars FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Wars Admin Write" ON public.wars;
CREATE POLICY "Wars Admin Write" ON public.wars FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Entries
ALTER TABLE public.war_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Entries Public Read" ON public.war_entries;
CREATE POLICY "Entries Public Read" ON public.war_entries FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Entries Insert Leader" ON public.war_entries;
CREATE POLICY "Entries Insert Leader" ON public.war_entries FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.crew_members 
        WHERE crew_id = war_entries.crew_id 
        AND profile_id = auth.uid() 
        AND role = 'crew_lider'
    )
);

-- Votes
ALTER TABLE public.war_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Votes Public Read" ON public.war_votes;
CREATE POLICY "Votes Public Read" ON public.war_votes FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Votes Admin Write" ON public.war_votes;
CREATE POLICY "Votes Admin Write" ON public.war_votes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

