-- Create the storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies: Use DO blocks to avoid "already exists" errors

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access Avatars'
    ) THEN
        CREATE POLICY "Public Access Avatars"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'avatars' );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload avatars'
    ) THEN
        CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can update own avatars'
    ) THEN
        CREATE POLICY "Users can update own avatars"
        ON storage.objects FOR UPDATE
        USING ( bucket_id = 'avatars' AND auth.uid() = owner )
        WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can delete own avatars'
    ) THEN
        CREATE POLICY "Users can delete own avatars"
        ON storage.objects FOR DELETE
        USING ( bucket_id = 'avatars' AND auth.uid() = owner );
    END IF;
END $$;
