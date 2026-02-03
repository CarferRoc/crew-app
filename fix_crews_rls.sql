-- Enable RLS on crews table if not already enabled
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public crews are viewable by everyone" ON public.crews;
DROP POLICY IF EXISTS "Users can create their own crews" ON public.crews;
DROP POLICY IF EXISTS "Users can update their own crews" ON public.crews;
DROP POLICY IF EXISTS "Users can delete their own crews" ON public.crews;

-- 1. VIEW: Everyone can see crews
CREATE POLICY "Public crews are viewable by everyone"
ON public.crews FOR SELECT
USING (true);

-- 2. CREATE: Authenticated users can create crews
CREATE POLICY "Users can create their own crews"
ON public.crews FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 3. UPDATE: Owners (created_by) can update
-- CRITICAL FIX: Added "WITH CHECK (true)" to allow changing 'created_by' (transfer ownership).
-- Without this, Postgres might check "auth.uid() = new_created_by" which would fail when giving it away.
CREATE POLICY "Users can update their own crews"
ON public.crews FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (true);

-- 4. DELETE: Owners (created_by) can delete
CREATE POLICY "Users can delete their own crews"
ON public.crews FOR DELETE
USING (auth.uid() = created_by);
