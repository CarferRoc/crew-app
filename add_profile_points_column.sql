-- Add pointsPersonal column to profiles table to match TypeScript definition
-- Using quotes to preserve camelCase as expected by the frontend code
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS "pointsPersonal" int DEFAULT 0;

-- Ensure RLS allows updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END
$$;
