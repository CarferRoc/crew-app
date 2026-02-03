-- Fix Infinite Recursion by using a SECURITY DEFINER function
-- This function allows checking leadership status without triggering RLS recursion

-- 1. Create Helper Function (SECURITY DEFINER bypasses RLS for the internal query)
CREATE OR REPLACE FUNCTION public.is_crew_leader(_crew_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Best practice for security definers
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.crew_members
    WHERE crew_id = _crew_id
      AND profile_id = auth.uid()
      AND role = 'crew_lider'
  );
END;
$$;


-- 2. Clean up old policies (Ensure we start fresh for this table)
DROP POLICY IF EXISTS "Members can view other members" ON public.crew_members;
DROP POLICY IF EXISTS "Users can join crews" ON public.crew_members;
DROP POLICY IF EXISTS "Leaders can update members" ON public.crew_members;
DROP POLICY IF EXISTS "Leaders can delete members" ON public.crew_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON public.crew_members;


-- 3. Re-create Policies using the Helper Function

-- VIEW: Everyone can view
CREATE POLICY "Members can view other members"
ON public.crew_members FOR SELECT
USING (true);

-- INSERT: Self-insert (Join)
CREATE POLICY "Users can join crews"
ON public.crew_members FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- UPDATE: Leaders can update other members (Transfer Leadership)
CREATE POLICY "Leaders can update members"
ON public.crew_members FOR UPDATE
USING (public.is_crew_leader(crew_id));

-- DELETE: 
-- A. Self delete (Leave)
CREATE POLICY "Users can delete their own membership"
ON public.crew_members FOR DELETE
USING (auth.uid() = profile_id);

-- B. Leader delete (Kick)
CREATE POLICY "Leaders can delete members"
ON public.crew_members FOR DELETE
USING (public.is_crew_leader(crew_id));
