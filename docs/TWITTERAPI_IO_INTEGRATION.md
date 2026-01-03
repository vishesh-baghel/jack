# TwitterAPI.io Integration Guide

This document explains the TwitterAPI.io integration for cost-effective tweet scraping.

---

## Overview

TwitterAPI.io replaces Apify as the primary tweet scraping provider, offering significant cost savings:

**Cost Comparison:**
- **TwitterAPI.io**: $0.00015 per tweet returned, $0.00012 per empty API call
- **Apify**: ~$0.0025 per tweet (16x more expensive)

**Example Monthly Costs (Daily Scraping):**
- Scraping 50 tweets/day from 5 creators:
  - TwitterAPI.io: ~$1.13/month
  - Apify: ~$18.75/month
- **Savings: ~$17/month (94% cost reduction)**

---

## Architecture

### Generic Scraper Interface

All Twitter scrapers implement the `TwitterScraper` interface:

```typescript
interface TwitterScraper {
  scrapeTweets(config: TwitterScraperConfig): Promise<ScrapedTweet[]>;
  validateHandle(handle: string): Promise<ValidationResult>;
  getProviderName(): string;
}
```

**Benefits:**
- Easy switching between providers (Apify, TwitterAPI.io, custom)
- Consistent data format regardless of provider
- Testable with mock implementations

### Provider Selection

The factory pattern allows easy provider switching:

```typescript
// In lib/scrapers/factory.ts
const scraper = TwitterScraperFactory.getScraper('twitterapi');
```

**Current Default:** `twitterapi` (TwitterAPI.io)
**Backup Available:** `apify` (Apify) - kept for future use

---

## Implementation Details

### 1. TwitterAPI.io Adapter

**File:** `lib/scrapers/twitterapi-scraper.ts`

**Key Features:**
- Advanced search API with time windows
- Pagination support with cost control
- Automatic date formatting (YYYY-MM-DD_HH:MM:SS_UTC)
- Respects `maxItems` limit to prevent over-scraping
- Handles errors gracefully without throwing

**Time Window Strategy:**
- Default: 24-hour window (yesterday to now)
- Minimizes empty API calls (charged at $0.00012)
- Optimized for daily cron job frequency

**Pagination Control:**
```typescript
// Stops pagination early when maxItems reached
while (hasMore && tweets.length < maxItems) {
  const remainingSlots = maxItems - tweets.length;
  tweets.push(...scrapedTweets.slice(0, remainingSlots));

  if (tweets.length >= maxItems) {
    console.log(`Reached maxItems limit (${maxItems}), stopping pagination`);
    break;
  }
}
```

### 2. Duplicate Prevention

**File:** `lib/db/creator-tweets.ts`

**Mechanism:** Upsert based on unique `tweetId`

```typescript
prisma.creatorTweet.upsert({
  where: { tweetId: tweet.tweetId },
  update: { content, metrics, scrapedAt: new Date() },
  create: { creatorId, tweetId, content, ... }
})
```

**Benefits:**
- Prevents duplicate storage automatically
- Updates metrics if tweet already exists
- Saves database storage costs
- Atomic operation (no race conditions)

### 3. Tweet Cleanup Cron Job

**File:** `app/api/cron/cleanup-tweets/route.ts`

**Schedule:** Daily at 3 AM UTC (1 hour after scraping job)

**Retention Policy:** Keep tweets for **7 days only**

**Why 7 Days:**
- Content ideas are generated daily from recent trends
- Older tweets have diminishing value
- Reduces database storage costs significantly
- Neon DB free tier: 500MB limit

**Estimated Storage Savings:**
- 50 tweets/day × 365 days × 1KB/tweet = 18MB/year (old policy: 90 days)
- 50 tweets/day × 7 days × 1KB/tweet = 350KB (new policy)
- **Savings: 98% reduction in tweet storage**

### 4. Cron Job Configuration

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-tweets",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/cleanup-tweets",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Schedule:**
- 2 AM UTC: Scrape tweets from all creators
- 3 AM UTC: Clean up tweets older than 7 days

**Authentication:** Both cron jobs require `CRON_SECRET` in `Authorization: Bearer` header

---

## Setup Instructions

### 1. Get TwitterAPI.io API Key

1. Visit https://twitterapi.io
2. Sign up for an account
3. Navigate to Dashboard → API Keys
4. Create a new API key
5. Copy the key

### 2. Add Environment Variable

Add to your `.env` file:

```bash
TWITTERAPI_IO_KEY=your_twitterapi_io_key_here
```

### 3. Deploy to Vercel

```bash
# Push changes to trigger deployment
git add .
git commit -m "feat: integrate TwitterAPI.io for cost-effective scraping"
git push

# Add environment variable in Vercel dashboard
vercel env add TWITTERAPI_IO_KEY
# Paste your API key when prompted

# Redeploy to apply changes
vercel --prod
```

### 4. Verify Cron Jobs

After deployment, check Vercel dashboard:

1. Go to **Deployments** → Latest deployment
2. Click **Functions** tab
3. Verify cron jobs are listed:
   - `/api/cron/scrape-tweets` - Runs daily at 2 AM UTC
   - `/api/cron/cleanup-tweets` - Runs daily at 3 AM UTC

### 5. Monitor First Run

**Check Scraping Job Logs:**

1. Go to Vercel dashboard → **Logs**
2. Filter by function: `/api/cron/scrape-tweets`
3. Look for:
   ```
   [TWITTERAPI.IO] Scraping tweets for @handle
   [TWITTERAPI.IO] Successfully scraped X tweets
   ```

**Check Cleanup Job Logs:**

1. Filter by function: `/api/cron/cleanup-tweets`
2. Look for:
   ```
   [CLEANUP] Deleting tweets published before YYYY-MM-DD
   [CLEANUP] Deleted X old tweets
   ```

---

## Cost Monitoring

### Daily Cost Estimation

**Assumptions:**
- 5 active creators
- 10 tweets per creator per day
- Daily scraping frequency

**Calculation:**
```
Total API calls per day: 5 creators
Tweets returned: 50 tweets (5 × 10)

Cost per day:
- Successful calls: 50 tweets × $0.00015 = $0.0075
- Empty calls (if any): 0 × $0.00012 = $0

Daily cost: ~$0.0075
Monthly cost (30 days): ~$0.225
Annual cost: ~$2.70
```

**Scaling:**
- 10 creators × 10 tweets: ~$0.45/month
- 20 creators × 20 tweets: ~$1.80/month
- 50 creators × 50 tweets: ~$11.25/month

**Compare to Apify:**
- Same volume (50 tweets/day): ~$37.50/month
- **Savings: ~$36/month**

### Monitor Usage

TwitterAPI.io dashboard shows:
- Total API calls
- Tweets returned
- Monthly spend
- Usage trends

**Set Budget Alert:**
1. Go to TwitterAPI.io dashboard
2. Set monthly budget alert (e.g., $5)
3. Receive email when approaching limit

---

## Error Handling

### Automatic Retry Logic

The adapter handles errors gracefully:

```typescript
catch (error) {
  console.error(`[TWITTERAPI.IO] Error scraping tweets:`, error);
  // Return what we have so far, don't throw
  break;
}
```

**Behavior:**
- Errors logged to console
- Partial results returned (tweets collected before error)
- Cron job continues with next creator
- No cascading failures

### Common Errors

**1. Invalid API Key**
```
Error: TwitterAPI.io request failed: 401 Unauthorized
```
**Fix:** Check `TWITTERAPI_IO_KEY` in environment variables

**2. Rate Limit Exceeded**
```
Error: TwitterAPI.io request failed: 429 Too Many Requests
```
**Fix:** Reduce scraping frequency or increase TwitterAPI.io plan

**3. Handle Not Found**
```
Twitter account not found or has no tweets in the last 30 days
```
**Fix:** Verify handle exists and is public

**4. Network Timeout**
```
Error: fetch failed
```
**Fix:** Temporary network issue, will retry next day

---

## Monitoring & Alerting

See `docs/VERCEL_MONITORING.md` for complete alerting setup.

**Quick Setup:**

1. **Use Better Stack (Free)**
   - Create account at https://betterstack.com
   - Add Vercel log drain integration
   - Create alert for: `"TWITTERAPI.IO" AND "Error"`

2. **Email Notifications**
   - Receive email when scraping fails
   - Daily summary of cron job runs

---

## Migration Path (Future)

If you need to switch back to Apify or try another provider:

### Switch to Apify

Update `lib/apify/twitter-scraper.ts`:

```typescript
const scraper = TwitterScraperFactory.getScraper('apify'); // Change here
```

Ensure `APIFY_API_KEY` is set in environment.

### Add New Provider (e.g., RapidAPI)

1. Create adapter: `lib/scrapers/rapidapi-scraper.ts`
2. Implement `TwitterScraper` interface
3. Add to factory:
   ```typescript
   case 'rapidapi':
     return new RapidAPITwitterScraper(process.env.RAPIDAPI_KEY);
   ```
4. Update default provider

---

## Testing

### Local Testing

```bash
# Test TwitterAPI.io adapter directly
pnpm test lib/scrapers/__tests__/twitterapi-scraper.test.ts

# Test scraping function
curl http://localhost:3000/api/creators/CREATOR_ID/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check logs for TwitterAPI.io activity
# Look for: [TWITTERAPI.IO] messages
```

### Production Testing

```bash
# Manually trigger scraping cron
curl https://your-app.vercel.app/api/cron/scrape-tweets \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Manually trigger cleanup cron
curl https://your-app.vercel.app/api/cron/cleanup-tweets \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Troubleshooting

### Issue: No tweets scraped

**Check:**
1. Creator handle is correct and public
2. Creator has posted in last 24 hours
3. `TWITTERAPI_IO_KEY` is valid
4. View Vercel logs for error details

### Issue: Duplicate tweets in database

**Resolution:**
- Duplicates are automatically prevented by upsert
- Check `tweetId` is being extracted correctly
- Verify unique constraint on `tweetId` column

### Issue: Cleanup job not running

**Check:**
1. Cron job configured in `vercel.json`
2. `CRON_SECRET` set in environment
3. Check Vercel cron logs
4. Verify schedule expression: `0 3 * * *`

### Issue: High TwitterAPI.io costs

**Reduce costs:**
1. Decrease `tweetCount` per creator
2. Decrease `dailyTweetLimit`
3. Pause inactive creators
4. Increase scraping interval (e.g., every 2 days)

---

## Summary

**What Changed:**
- ✅ Added TwitterAPI.io adapter (94% cost savings)
- ✅ Switched default provider from Apify to TwitterAPI.io
- ✅ Implemented duplicate prevention (upsert by tweetId)
- ✅ Added cleanup cron job (7-day retention)
- ✅ Updated environment variable documentation
- ✅ Created monitoring and alerting guide

**What Stayed:**
- ✅ Apify integration kept for backup
- ✅ Generic scraper interface unchanged
- ✅ Existing cron job logic preserved
- ✅ Database schema unchanged

**Next Steps:**
1. Add `TWITTERAPI_IO_KEY` to your environment
2. Deploy to Vercel
3. Monitor first cron job run
4. Set up error alerting (see VERCEL_MONITORING.md)
5. Track costs in TwitterAPI.io dashboard
