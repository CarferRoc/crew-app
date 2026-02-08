-- Fix for "null value in column title of relation wars violates not-null constraint"
-- The application uses 'name', but the database seems to have a legacy 'title' column.
-- We will make 'title' nullable to resolve the issue.

DO $$
BEGIN
    -- Check if the 'title' column exists in the 'wars' table
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'wars'
          AND column_name = 'title'
    ) THEN
        -- Alter the column to be nullable
        ALTER TABLE public.wars ALTER COLUMN title DROP NOT NULL;
    END IF;
END $$;
