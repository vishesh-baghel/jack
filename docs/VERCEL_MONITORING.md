# Vercel Monitoring & Error Alerting Setup

This guide explains how to configure error alerting for critical failures in Jack's cron jobs and API routes.

---

## Option 1: Vercel Log Drains (Recommended)

Vercel doesn't have built-in email alerting for runtime errors, but you can set up **Log Drains** to send logs to monitoring services.

### Setup Steps:

1. **Navigate to Project Settings**
   - Go to your Vercel dashboard
   - Select the `jack-x-agent` project
   - Click **Settings** → **Log Drains**

2. **Add a Log Drain Integration**

   Choose one of these services:

   **A. Axiom (Free Tier Available)**
   - Create account at https://axiom.co
   - Create a dataset called `jack-logs`
   - Copy the API token
   - In Vercel, add Axiom integration
   - Configure alerts in Axiom dashboard for:
     - `[CRON] Tweet scraping job failed`
     - `[CRON] Tweet cleanup job failed`
     - HTTP 500 errors

   **B. Datadog (Paid)**
   - Create account at https://www.datadoghq.com
   - Get API key
   - Add Datadog integration in Vercel
   - Configure monitors for error keywords

   **C. Better Stack (Formerly Logtail) - Free Tier**
   - Create account at https://betterstack.com
   - Create a source
   - Add Better Stack integration in Vercel
   - Set up alerts for error patterns

3. **Create Alert Rules**

   In your monitoring service dashboard, create alerts for:
   - **Cron Job Failures**: `success: false` in cron responses
   - **API Errors**: HTTP status 500 or 503
   - **Database Errors**: `prisma` error keywords
   - **Twitter API Errors**: `TWITTERAPI.IO` error keywords

---

## Option 2: Vercel Integration Marketplace

Vercel offers integrations with monitoring tools that can send email/Slack alerts:

### Setup Steps:

1. **Go to Integrations**
   - Visit https://vercel.com/integrations
   - Browse monitoring/observability tools

2. **Recommended Integration: Sentry**

   **Why Sentry:**
   - Captures runtime errors automatically
   - Email alerts for new errors
   - Error grouping and frequency tracking
   - Free tier: 5,000 errors/month

   **Setup:**
   ```bash
   pnpm add @sentry/nextjs
   ```

   Create `sentry.client.config.ts`:
   ```typescript
   import * as Sentry from '@sentry/nextjs';

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 0.1,
     environment: process.env.NODE_ENV,
   });
   ```

   Create `sentry.server.config.ts`:
   ```typescript
   import * as Sentry from '@sentry/nextjs';

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     tracesSampleRate: 0.1,
     environment: process.env.NODE_ENV,
   });
   ```

   Add to `.env`:
   ```
   SENTRY_DSN=your_sentry_dsn
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```

   **Configure Alerts in Sentry:**
   - Go to Sentry project settings
   - Click **Alerts** → **Create Alert**
   - Set conditions: "When an issue is first seen"
   - Action: "Send a notification via Email"

---

## Option 3: Manual Email Alerts via Resend

If you prefer code-based email alerts without third-party monitoring:

### Setup Steps:

1. **Install Resend**
   ```bash
   pnpm add resend
   ```

2. **Get Resend API Key**
   - Sign up at https://resend.com
   - Free tier: 100 emails/day
   - Copy API key

3. **Add to `.env`**
   ```
   RESEND_API_KEY=your_resend_api_key
   ALERT_EMAIL=your_email@example.com
   ```

4. **Create Alert Helper**

   Create `lib/alerts.ts`:
   ```typescript
   import { Resend } from 'resend';

   const resend = new Resend(process.env.RESEND_API_KEY);

   export async function sendCriticalAlert(
     subject: string,
     message: string,
     error?: Error
   ) {
     if (!process.env.ALERT_EMAIL || !process.env.RESEND_API_KEY) {
       console.error('[ALERT] Alert email not configured');
       return;
     }

     try {
       await resend.emails.send({
         from: 'Jack Alerts <alerts@yourdomain.com>',
         to: process.env.ALERT_EMAIL,
         subject: `[CRITICAL] ${subject}`,
         html: `
           <h2>Critical Error in Jack Agent</h2>
           <p><strong>Message:</strong> ${message}</p>
           ${error ? `
             <p><strong>Error:</strong></p>
             <pre>${error.message}</pre>
             <pre>${error.stack}</pre>
           ` : ''}
           <p><strong>Time:</strong> ${new Date().toISOString()}</p>
         `,
       });

       console.log('[ALERT] Critical alert sent successfully');
     } catch (alertError) {
       console.error('[ALERT] Failed to send alert email:', alertError);
     }
   }
   ```

5. **Use in Cron Jobs**

   Update `app/api/cron/scrape-tweets/route.ts`:
   ```typescript
   import { sendCriticalAlert } from '@/lib/alerts';

   // In catch block:
   catch (error) {
     console.error('[CRON] Critical error:', error);

     // Send alert for critical failures
     await sendCriticalAlert(
       'Tweet Scraping Cron Failed',
       'The daily tweet scraping job encountered a critical error',
       error instanceof Error ? error : undefined
     );

     return NextResponse.json({ success: false, error: ... });
   }
   ```

---

## Current Implementation

For now, Jack logs all errors to console with clear prefixes:
- `[CRON]` - Cron job logs
- `[TWITTERAPI.IO]` - Twitter API scraper logs
- `[CLEANUP]` - Database cleanup logs

**To view logs in Vercel:**
1. Go to your project dashboard
2. Click **Logs** tab
3. Filter by function: `/api/cron/scrape-tweets` or `/api/cron/cleanup-tweets`
4. Look for `success: false` or error keywords

---

## Recommended Setup for Jack

For a cost-effective solution:

1. **Use Vercel Logs** (Free)
   - Monitor logs manually in Vercel dashboard
   - Set up daily routine to check cron job status

2. **Add Better Stack Log Drain** (Free tier available)
   - Automatic log aggregation
   - Email alerts for critical errors
   - 7-day log retention

3. **Optional: Add Sentry** for production (Free tier: 5K errors/month)
   - Automatic error tracking
   - Email notifications
   - Error grouping and context

---

## Next Steps

1. Choose monitoring solution from options above
2. Configure email alerts for:
   - Cron job failures
   - Database errors
   - Twitter API rate limits
   - Unexpected 500 errors
3. Test alerts by intentionally triggering an error
4. Monitor for first week to tune alert thresholds

---

## Testing Alerts

To test if your alerting is working:

1. **Trigger Cron Job Error**
   ```bash
   # Call cron without auth header
   curl https://your-app.vercel.app/api/cron/scrape-tweets
   # Should fail with 401
   ```

2. **Trigger API Error**
   - Temporarily remove `TWITTERAPI_IO_KEY` from env
   - Try adding a new creator
   - Should fail and log error

3. **Check Logs**
   - Verify error appears in Vercel logs
   - Verify alert email/notification received

---

## Cost Comparison

| Solution | Cost | Setup Time | Features |
|----------|------|------------|----------|
| Vercel Logs Only | Free | 0 min | Manual monitoring |
| Better Stack | Free tier | 10 min | Email alerts, 7d retention |
| Axiom | Free tier | 15 min | Advanced queries, alerts |
| Sentry | Free tier | 20 min | Full error tracking |
| Resend Email | $0 (100/day free) | 30 min | Custom email alerts |

**Recommendation:** Start with Better Stack (free) for automated email alerts, upgrade to Sentry if you need detailed error tracking.
