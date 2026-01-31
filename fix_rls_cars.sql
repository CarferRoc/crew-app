-- POLICY: Enable read access for all users to the 'cars' table
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS is enabled (standard practice)
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- 2. Create the policy for SELECT (Read) access
-- This allows anyone (anon or authenticated) to read the cars data
CREATE POLICY "Enable read access for all users" 
ON "cars" 
FOR SELECT 
USING (true);

-- 3. (Optional) If you get an error that the policy already exists, you can drop it first:
-- DROP POLICY IF EXISTS "Enable read access for all users" ON "cars";
