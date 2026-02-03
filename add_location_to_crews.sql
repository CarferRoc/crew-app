-- Add location column to crews table
ALTER TABLE public.crews
ADD COLUMN location text;

-- Optional: Update RLS if needed, but standard insert/select policies should catch it if they cover all columns.
