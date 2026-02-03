-- Allow crew leaders to update members (e.g. promoting them)
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Members can view other members" ON public.crew_members;
DROP POLICY IF EXISTS "Users can join crews" ON public.crew_members;
DROP POLICY IF EXISTS "Leaders can update members" ON public.crew_members;
DROP POLICY IF EXISTS "Leaders can delete members" ON public.crew_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON public.crew_members;


-- 1. VIEW
CREATE POLICY "Members can view other members"
ON public.crew_members FOR SELECT
USING (true);

-- 2. INSERT (Joining) - usually self-insert or specific logic. 
-- Assuming earlier logic covers "Users can insert their own profile" or similar.
-- Let's keep it simple: allow authenticated to insert (controller logic restricts)
CREATE POLICY "Users can join crews"
ON public.crew_members FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- 3. UPDATE: Leaders can update other members (TRANSFER LEADERSHIP Requirement)
-- We need to check if the *current performing user* is a leader of that crew.
-- This requires a subquery or a lookup.
-- "auth.uid() is a leader of the crew being updated"
CREATE POLICY "Leaders can update members"
ON public.crew_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.crew_members as helpers
    WHERE helpers.crew_id = crew_members.crew_id
    AND helpers.profile_id = auth.uid()
    AND helpers.role = 'crew_lider'
  )
);

-- 4. DELETE: 
-- A. Self delete (Leave)
CREATE POLICY "Users can delete their own membership"
ON public.crew_members FOR DELETE
USING (auth.uid() = profile_id);

-- B. Leader delete (Kick)
CREATE POLICY "Leaders can delete members"
ON public.crew_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.crew_members as helpers
    WHERE helpers.crew_id = crew_members.crew_id
    AND helpers.profile_id = auth.uid()
    AND helpers.role = 'crew_lider'
  )
);
