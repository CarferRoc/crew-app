# Quick Start: Deploy Auction Resolution

## 1. Install Supabase CLI
```bash
npm install -g supabase
```

## 2. Login & Link
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## 3. Deploy Function
```bash
cd /Users/paulasolaz/Desktop/crew-app
supabase functions deploy resolve-auctions
```

## 4. Setup Cron
Run `setup_auction_cron.sql` in Supabase SQL Editor (replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY)

## 5. Test
```bash
supabase functions invoke resolve-auctions
```

## 6. Monitor
```bash
supabase functions logs resolve-auctions
```

---

**That's it!** Auctions will now resolve automatically every day at 20:00 CET.

See [walkthrough.md](file:///Users/paulasolaz/.gemini/antigravity/brain/dedd0d37-e843-4469-befd-436bcbbfe522/walkthrough.md) for detailed documentation.
