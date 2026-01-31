-- POLICY: Enable read access for 'leagues' table
-- This allows users to see league details when joining or fetching their list

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- 1. Allow reading leagues (everyone can see basic league info or at least leagues they are in)
-- For simplicity, we allow public read so the JOIN works 
CREATE POLICY "Enable read access for all users" 
ON "leagues" 
FOR SELECT 
USING (true);

-- 2. Allow users to insert their own leagues
CREATE POLICY "Enable insert for authenticated users" 
ON "leagues" 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);
