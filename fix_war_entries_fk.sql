-- Fix war_entries foreign key to point to profiles instead of auth.users
-- This allows PostgREST to fetch profile data (username, avatar) directly

DO $$
BEGIN
    -- 1. Drop existing FK if it points to auth.users (constraint name might vary, so we try to find it or just drop by column if possible)
    -- We'll try standard naming or just force drop/add
    -- Standard naming for "REFERENCES auth.users(id)" on column member_id might be "war_entries_member_id_fkey"
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'war_entries_member_id_fkey'
        AND table_name = 'war_entries'
    ) THEN
        ALTER TABLE public.war_entries DROP CONSTRAINT war_entries_member_id_fkey;
    END IF;

    -- 2. Add new FK to public.profiles
    -- We use ON UPDATE CASCADE to handle potential ID changes (rare for UUIDs but good practice)
    ALTER TABLE public.war_entries 
    ADD CONSTRAINT war_entries_member_id_fkey_profiles 
    FOREIGN KEY (member_id) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;

END $$;
