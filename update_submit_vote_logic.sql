CREATE OR REPLACE FUNCTION submit_war_vote(p_war_id uuid, p_entry_id uuid, p_score int)
RETURNS void AS $$
DECLARE
    v_crew_id uuid;
    v_old_score int;
    v_diff int;
BEGIN
    -- Check admin role
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Only admins can vote.';
    END IF;

    -- Get Crew ID from Entry
    SELECT crew_id INTO v_crew_id FROM public.war_entries WHERE id = p_entry_id;
    IF v_crew_id IS NULL THEN
        RAISE EXCEPTION 'Entry not found.';
    END IF;

    -- Check for existing vote to calculate difference
    SELECT score INTO v_old_score 
    FROM public.war_votes 
    WHERE war_id = p_war_id AND entry_id = p_entry_id AND admin_id = auth.uid();

    v_diff := p_score - COALESCE(v_old_score, 0);

    -- Insert or Update Vote
    INSERT INTO public.war_votes (war_id, entry_id, admin_id, score)
    VALUES (p_war_id, p_entry_id, auth.uid(), p_score)
    ON CONFLICT (war_id, entry_id, admin_id) 
    DO UPDATE SET score = EXCLUDED.score;

    -- Distribute Points (Delta) to Crew Members
    IF v_diff <> 0 THEN
        -- 1. Update Crew Members war_points
        UPDATE public.crew_members
        SET war_points = COALESCE(war_points, 0) + v_diff
        WHERE crew_id = v_crew_id;

        -- 2. Update Profiles pointsPersonal
        UPDATE public.profiles
        SET "pointsPersonal" = COALESCE("pointsPersonal", 0) + v_diff
        WHERE id IN (
            SELECT profile_id FROM public.crew_members WHERE crew_id = v_crew_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
