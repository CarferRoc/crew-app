# Supabase Edge Function Deployment Guide

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

## Deploy the Edge Function

```bash
supabase functions deploy resolve-auctions
```

## Set Environment Variables

The function needs access to your Supabase URL and service role key. These are automatically available in the Edge Function environment.

## Configure Cron Schedule

To run the function daily at 20:00 (8:00 PM) Spanish time (CET/CEST):

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Extensions**
3. Enable the `pg_cron` extension
4. Go to **SQL Editor** and run:

```sql
-- Schedule the function to run daily at 20:00 CET (19:00 UTC in winter, 18:00 UTC in summer)
-- Note: Supabase uses UTC time, so adjust accordingly

-- For CET (UTC+1) - Winter time
SELECT cron.schedule(
  'resolve-auctions-daily',
  '0 19 * * *', -- 19:00 UTC = 20:00 CET
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/resolve-auctions',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- To check scheduled jobs:
SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('resolve-auctions-daily');
```

### Option 2: Using External Cron Service (Alternative)

If you prefer using an external service like GitHub Actions or cron-job.org:

1. Create a webhook endpoint that calls your Edge Function
2. Schedule it to run at 20:00 daily

Example GitHub Actions workflow (`.github/workflows/resolve-auctions.yml`):

```yaml
name: Resolve Daily Auctions

on:
  schedule:
    # Runs at 19:00 UTC (20:00 CET) every day
    - cron: '0 19 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  resolve-auctions:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://YOUR_PROJECT_REF.supabase.co/functions/v1/resolve-auctions \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

## Manual Testing

To manually trigger the function for testing:

```bash
# Using curl
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/resolve-auctions \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Using Supabase CLI
supabase functions invoke resolve-auctions
```

## Monitoring

Check the function logs:

```bash
supabase functions logs resolve-auctions
```

Or in the Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on `resolve-auctions`
3. View the **Logs** tab

## Troubleshooting

### Function not running at scheduled time
- Verify `pg_cron` extension is enabled
- Check cron job is scheduled: `SELECT * FROM cron.job;`
- Verify timezone settings

### Function errors
- Check logs for detailed error messages
- Verify database permissions
- Ensure service role key has proper access

### Auctions not resolving
- Check if bids exist in `market_bids` table
- Verify `last_auction_resolved_at` timestamp in `leagues` table
- Check participant budgets are sufficient

## Important Notes

⚠️ **Timezone Consideration**: 
- Supabase Edge Functions run in UTC
- Spain uses CET (UTC+1) in winter and CEST (UTC+2) in summer
- Adjust cron schedule accordingly:
  - Winter (CET): `0 19 * * *` (19:00 UTC = 20:00 CET)
  - Summer (CEST): `0 18 * * *` (18:00 UTC = 20:00 CEST)

For automatic DST handling, consider using a more sophisticated scheduling solution or accept the 1-hour shift during summer.
