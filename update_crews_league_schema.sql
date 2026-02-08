-- Add League columns to Crews table
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS code text;

ALTER TABLE public.crews
ADD COLUMN IF NOT EXISTS league_id uuid REFERENCES public.leagues(id),
ADD COLUMN IF NOT EXISTS total_season_points int DEFAULT 0;

-- Initialize all crews to the lowest league (Level 1)
DO $$
DECLARE
    v_starter_league_id uuid;
BEGIN
    SELECT id INTO v_starter_league_id FROM public.leagues WHERE level = 1 LIMIT 1;
    
    IF v_starter_league_id IS NOT NULL THEN
        UPDATE public.crews
        SET league_id = v_starter_league_id
        WHERE league_id IS NULL;
    END IF;
END $$;
