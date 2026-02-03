-- Add ON DELETE CASCADE to foreign keys referencing 'crews' table
-- This allows a crew to be deleted even if it has related data

BEGIN;

-- 1. Crew Members
ALTER TABLE public.crew_members
DROP CONSTRAINT IF EXISTS crew_members_crew_id_fkey;

ALTER TABLE public.crew_members
ADD CONSTRAINT crew_members_crew_id_fkey
FOREIGN KEY (crew_id)
REFERENCES public.crews (id)
ON DELETE CASCADE;


-- 2. Crew Join Requests
ALTER TABLE public.crew_join_requests
DROP CONSTRAINT IF EXISTS crew_join_requests_crew_id_fkey;

ALTER TABLE public.crew_join_requests
ADD CONSTRAINT crew_join_requests_crew_id_fkey
FOREIGN KEY (crew_id)
REFERENCES public.crews (id)
ON DELETE CASCADE;


-- 3. Events
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_crew_id_fkey;

ALTER TABLE public.events
ADD CONSTRAINT events_crew_id_fkey
FOREIGN KEY (crew_id)
REFERENCES public.crews (id)
ON DELETE CASCADE;


-- 4. Crew Invites
ALTER TABLE public.crew_invites
DROP CONSTRAINT IF EXISTS crew_invites_crew_id_fkey;

ALTER TABLE public.crew_invites
ADD CONSTRAINT crew_invites_crew_id_fkey
FOREIGN KEY (crew_id)
REFERENCES public.crews (id)
ON DELETE CASCADE;


-- 5. Crew Alliances (Requester)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crew_alliances') THEN
        ALTER TABLE public.crew_alliances
        DROP CONSTRAINT IF EXISTS crew_alliances_requester_crew_id_fkey;

        ALTER TABLE public.crew_alliances
        ADD CONSTRAINT crew_alliances_requester_crew_id_fkey
        FOREIGN KEY (requester_crew_id)
        REFERENCES public.crews (id)
        ON DELETE CASCADE;
    END IF;
END $$;


-- 6. Crew Alliances (Target)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crew_alliances') THEN
        ALTER TABLE public.crew_alliances
        DROP CONSTRAINT IF EXISTS crew_alliances_target_crew_id_fkey;

        ALTER TABLE public.crew_alliances
        ADD CONSTRAINT crew_alliances_target_crew_id_fkey
        FOREIGN KEY (target_crew_id)
        REFERENCES public.crews (id)
        ON DELETE CASCADE;
    END IF;
END $$;


-- 7 & 8. Battles (Crew A & B)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'battles') THEN
        -- Crew A
        ALTER TABLE public.battles
        DROP CONSTRAINT IF EXISTS battles_crew_a_fkey;

        ALTER TABLE public.battles
        ADD CONSTRAINT battles_crew_a_fkey
        FOREIGN KEY (crew_a)
        REFERENCES public.crews (id)
        ON DELETE CASCADE;

        -- Crew B
        ALTER TABLE public.battles
        DROP CONSTRAINT IF EXISTS battles_crew_b_fkey;

        ALTER TABLE public.battles
        ADD CONSTRAINT battles_crew_b_fkey
        FOREIGN KEY (crew_b)
        REFERENCES public.crews (id)
        ON DELETE CASCADE;
    END IF;
END $$;


-- 9. Crew Messages (Chat)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crew_messages') THEN
        ALTER TABLE public.crew_messages
        DROP CONSTRAINT IF EXISTS crew_messages_crew_id_fkey;

        ALTER TABLE public.crew_messages
        ADD CONSTRAINT crew_messages_crew_id_fkey
        FOREIGN KEY (crew_id)
        REFERENCES public.crews (id)
        ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;
