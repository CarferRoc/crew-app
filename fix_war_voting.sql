-- Fix submit_war_vote to update total_score immediately
CREATE OR REPLACE FUNCTION submit_war_vote(p_war_id uuid, p_entry_id uuid, p_score int)
RETURNS void AS $$
BEGIN
    -- Check admin role
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Only admins can vote.';
    END IF;

    -- Insert or Update Vote
    INSERT INTO public.war_votes (war_id, entry_id, admin_id, score)
    VALUES (p_war_id, p_entry_id, auth.uid(), p_score)
    ON CONFLICT (war_id, entry_id, admin_id) 
    DO UPDATE SET score = EXCLUDED.score;

    -- Update Total Score for the Entry
    UPDATE public.war_entries
    SET total_score = (
        SELECT COALESCE(SUM(score), 0) 
        FROM public.war_votes 
        WHERE entry_id = p_entry_id
    )
    WHERE id = p_entry_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
