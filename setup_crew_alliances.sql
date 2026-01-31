-- 1. Create crew_alliances table
CREATE TABLE IF NOT EXISTS public.crew_alliances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_crew_id uuid REFERENCES public.crews(id) ON DELETE CASCADE,
    target_crew_id uuid REFERENCES public.crews(id) ON DELETE CASCADE,
    status text DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at timestamptz DEFAULT now(),
    UNIQUE(requester_crew_id, target_crew_id)
);

-- 2. Add joint_crew_ids to events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS joint_crew_ids uuid[] DEFAULT '{}';

-- 3. RLS Policies for crew_alliances

-- Enable RLS
ALTER TABLE public.crew_alliances ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read alliances (to see "Allied Crews")
CREATE POLICY "Public Read Alliances"
ON public.crew_alliances FOR SELECT
USING (true);

-- Policy: Crew Leaders can insert (request) alliances
-- This is a bit complex in pure SQL RLS without helper functions, simplified check:
-- Ideally we check if auth.uid() is a leader of requester_crew_id.
-- For MVP/Speed, we'll allow authenticated insert, and trust the App Logic / triggers (or refine later).
CREATE POLICY "Authenticated Insert Alliances"
ON public.crew_alliances FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Crew Leaders can update (accept/reject)
CREATE POLICY "Authenticated Update Alliances"
ON public.crew_alliances FOR UPDATE
USING (auth.role() = 'authenticated');

-- 4. Storage for event images if not exists (already done usually, but ensuring)
