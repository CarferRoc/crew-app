-- Add team_parts column to store user's inventory of parts
-- Run this in Supabase SQL Editor

ALTER TABLE public.league_participants 
ADD COLUMN IF NOT EXISTS team_parts JSONB DEFAULT '[]'::jsonb;
