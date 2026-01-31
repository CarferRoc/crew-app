-- Add attendees column to events table if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS attendees text[] DEFAULT '{}';

-- Check policy for update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events' AND policyname = 'Authenticated users can update events (join)'
    ) THEN
        CREATE POLICY "Authenticated users can update events (join)"
        ON public.events FOR UPDATE
        USING ( auth.role() = 'authenticated' )
        WITH CHECK ( auth.role() = 'authenticated' );
    END IF;
END $$;
