-- 1. Fix "column crews_1.badge does not exist"
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS badge text;

-- 2. Fix "column reference 'id' is ambiguous" in end_war function
CREATE OR REPLACE FUNCTION end_war(p_war_id uuid)
RETURNS void AS $$
DECLARE
    v_crew_record RECORD;
    v_war RECORD;
    v_points int;
    v_bonus int;
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
    IF v_war.is_multiguerra THEN
        UPDATE public.war_entries e
        SET rank = sub.rnk
        FROM (
            SELECT id, RANK() OVER (PARTITION BY group_id ORDER BY total_score DESC) as rnk
            FROM public.war_entries
            WHERE war_id = p_war_id
        ) sub
        WHERE e.id = sub.id;
    ELSE
         UPDATE public.war_entries e
        SET rank = sub.rnk
        FROM (
            -- FIX: Specify 'e.id' to avoid ambiguity between war_entries.id and crews.id
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
          ); 
    ELSE
        -- Regular: Top 3 up
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

        -- DOWN (Bottom 3)
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
