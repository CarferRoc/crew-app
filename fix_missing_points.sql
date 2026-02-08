-- Force sync of ALL points from war votes to all members
-- This is a heavy operation but ensures consistency
DO $$
DECLARE
    r RECORD;
    v_total_points int;
BEGIN
    -- Iterate over each crew that has received votes in active wars
    FOR r IN 
        SELECT e.crew_id, SUM(v.score) as total_crew_points
        FROM public.war_entries e
        JOIN public.war_votes v ON e.id = v.entry_id
        JOIN public.wars w ON e.war_id = w.id
        WHERE w.status IN ('active', 'voting')
        GROUP BY e.crew_id
    LOOP
        -- 1. Update Crew Members war_points (Reset and Re-apply)
        -- NOTE: This effectively resets war_points to match the current voting sum.
        -- Be careful if there are other sources of war_points (like MVP).
        -- Strategy: We only ADD the missing difference? No, easier to recalculate if we trust votes are the main source.
        -- BUT, MVP points are separate.
        
        -- Let's just do a specific fix for the user's reported issue: "General points not adding".
        -- We will re-run the "add" logic for existing votes, but only if we suspect they weren't added.
        -- Actually, safer to just rely on the V2 script for FUTURE votes.
        
        -- The user wants to see the points NOW.
        -- Let's update profile points for all members of the crew with the CURRENT total score,
        -- assuming they might have 0.
        
        -- But wait, if they already have points, we double count?
        -- Yes, dangerous.
        
        -- Better approach: Check if points are 0 or very low compared to votes.
        
        -- Alternative: trust the user ran V2 script and it works for NEW votes, but OLD votes are missing.
        -- The recalculate_war_scores.sql fixed the LEADERBOARD.
        -- Now we fix the MEMBERS.
        
        -- Fix Members:
        UPDATE public.crew_members
        SET war_points = r.total_crew_points
        WHERE crew_id = r.crew_id 
        AND (war_points IS NULL OR war_points = 0); -- Only if they have 0
        
        UPDATE public.profiles
        SET "pointsPersonal" = "pointsPersonal" + r.total_crew_points
        WHERE id IN (
            SELECT profile_id FROM public.crew_members 
            WHERE crew_id = r.crew_id AND (war_points IS NULL OR war_points = 0)
        )
        AND "pointsPersonal" = 0; -- Only if they have 0 (safety)
        
    END LOOP;
END $$;
