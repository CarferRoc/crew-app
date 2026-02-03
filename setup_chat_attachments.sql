-- 1. Update Tables with new columns
ALTER TABLE public.crew_messages 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_url text;

ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_url text;

-- 2. Create Storage Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
DO $$
BEGIN
    -- Public Read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access Chat Attachments'
    ) THEN
        CREATE POLICY "Public Access Chat Attachments"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'chat-attachments' );
    END IF;

    -- Authenticated Upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload chat attachments'
    ) THEN
        CREATE POLICY "Authenticated users can upload chat attachments"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'chat-attachments' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END $$;
