-- Drop the existing foreign key
ALTER TABLE public.crew_members
DROP CONSTRAINT IF EXISTS crew_members_crew_id_fkey;

-- Re-add it with ON DELETE CASCADE
ALTER TABLE public.crew_members
ADD CONSTRAINT crew_members_crew_id_fkey
FOREIGN KEY (crew_id)
REFERENCES public.crews (id)
ON DELETE CASCADE;
