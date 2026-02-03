-- Setup automatic auction resolution using pg_cron
-- This script configures a daily cron job to resolve auctions at 20:00 CET

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Schedule the auction resolution function
-- Runs at 19:00 UTC (20:00 CET in winter) every day
-- Note: Adjust to 18:00 UTC for summer time (CEST)
SELECT cron.schedule(
  'resolve-auctions-daily',
  '0 19 * * *', -- 19:00 UTC = 20:00 CET
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/resolve-auctions',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 4. Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'resolve-auctions-daily';

-- OPTIONAL: To manually trigger the job for testing
-- SELECT cron.schedule('test-auction-resolution', '* * * * *', 
--   $$ SELECT net.http_post(...) $$
-- );
-- Then unschedule after testing:
-- SELECT cron.unschedule('test-auction-resolution');

-- OPTIONAL: To remove the scheduled job
-- SELECT cron.unschedule('resolve-auctions-daily');

-- IMPORTANT NOTES:
-- 1. Replace YOUR_PROJECT_REF with your actual Supabase project reference
-- 2. Replace YOUR_SERVICE_ROLE_KEY with your service role key (not anon key)
-- 3. The service role key should be kept secret and only used server-side
-- 4. For summer time (CEST), change the cron schedule to '0 18 * * *'
