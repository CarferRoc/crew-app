-- Recalculate total_score for all war entries based on existing votes
UPDATE public.war_entries e
SET total_score = (
    SELECT COALESCE(SUM(score), 0)
    FROM public.war_votes v
    WHERE v.entry_id = e.id
);
