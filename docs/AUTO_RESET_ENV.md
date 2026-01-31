# Environment Variables for Auto-Reset Feature

## Required for Production

Add these environment variables to your Vercel project:

### CRON_SECRET
A secret key to protect the cron endpoint from unauthorized access.

**How to generate:**
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to Vercel:**
1. Go to Project Settings → Environment Variables
2. Add:
   - Key: `CRON_SECRET`
   - Value: Your generated secret
   - Environment: Production, Preview, Development

**Note:** This is used in `/api/cron/auto-reset-meals/route.ts` to verify requests.

## Testing Locally

For local development testing:

```bash
# Add to .env.local
CRON_SECRET=your-test-secret-here
```

## Vercel Cron Schedule

The cron job is configured in `vercel.json`:
- Schedule: `"0 * * * *"` (every hour at minute 0)
- Path: `/api/cron/auto-reset-meals`

**Note:** Vercel Cron only works in production. For local testing, manually call the endpoint with the secret:

```bash
curl -X POST http://localhost:3000/api/cron/auto-reset-meals \
  -H "Authorization: Bearer your-test-secret-here"
```
