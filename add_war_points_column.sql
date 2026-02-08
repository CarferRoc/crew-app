-- Add war_points column to crew_members table
ALTER TABLE public.crew_members
ADD COLUMN IF NOT EXISTS war_points int DEFAULT 0;

-- Ensure RLS allows admins to update this column if needed (though the function is SECURITY DEFINER)
-- The function runs as the owner (usually postgres or admin), so it bypasses RLS for the update.
