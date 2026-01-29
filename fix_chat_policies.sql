-- 1. Enable Realtime for crew_messages (This is what you need for live chat)
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'crew_messages'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_messages;
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'events'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'crew_join_requests'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_join_requests;
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'crew_members'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_members;
  END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE public.crew_messages ENABLE ROW LEVEL SECURITY;

-- 3. Drop Exising Policies (Use the EXACT names of the policies you want to replace)
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON public.crew_messages;
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON public.crew_messages;

-- 4. Re-create Policies
CREATE POLICY "Authenticated users can view chat messages"
ON public.crew_messages FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert chat messages"
ON public.crew_messages FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
