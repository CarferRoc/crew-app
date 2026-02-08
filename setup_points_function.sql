-- Function to award points manually
CREATE OR REPLACE FUNCTION award_war_points(p_crew_id uuid, p_amount int, p_member_id uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
    -- Check admin permission
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Only admins can award points.';
    END IF;

    IF p_member_id IS NOT NULL THEN
        -- Award to specific member (MVP Score)
        UPDATE public.crew_members
        SET war_points = COALESCE(war_points, 0) + p_amount
        WHERE crew_id = p_crew_id AND profile_id = p_member_id;

        -- SYNC: Update User Profile Points
        UPDATE public.profiles
        SET "pointsPersonal" = COALESCE("pointsPersonal", 0) + p_amount
        WHERE id = p_member_id;
    ELSE
        -- Award to ALL crew members (Clan Score)
        UPDATE public.crew_members
        SET war_points = COALESCE(war_points, 0) + p_amount
        WHERE crew_id = p_crew_id;

        -- SYNC: Update User Profile Points for ALL members
        UPDATE public.profiles
        SET "pointsPersonal" = COALESCE("pointsPersonal", 0) + p_amount
        WHERE id IN (
            SELECT profile_id FROM public.crew_members WHERE crew_id = p_crew_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
