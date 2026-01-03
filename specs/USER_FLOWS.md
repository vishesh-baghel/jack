# User Flows Specification

**Purpose:** Define complete user journeys through Jack

---

## Flow 1: Daily Content Creation (Primary Flow)

**Actor:** Vishesh  
**Goal:** Create 3 posts for today  
**Time:** ~60 minutes total (20 min per post)

### Steps

**5:00 PM - Open Jack**
```
1. Navigate to jack.visheshbaghel.com
2. See today's 5 content ideas (generated automatically)
3. Ideas are fresh (fetched 2 hours ago, still cached)
4. Notice: "⭐ Learned from 5 good posts" indicator
```

**5:02 PM - Select First Idea**
```
5. Read idea #1: "MCP Server Debugging Patterns"
6. Rationale shown:
   - MCP trending (12 creators mentioned today)
   - You solved this recently (in projects context)
   - Matches your "show struggle" pattern (learned!)
7. Click "Get Outline"
```

**5:03 PM - Wait for Outline**
```
8. Loading state: "Jack is creating your outline... (~10 seconds)"
9. Backend calls Mastra agent
10. Agent:
    - Gets idea details
    - Gets tone config + learned patterns
    - Gets last 5 "good" posts for reference
    - Calls GPT-4 to generate structured outline
    - Validates tone in examples (lowercase, no emojis, etc.)
    - Stores outline in DB
11. Outline appears
```

**5:04 PM - Review Outline & Write Content**
```
12. See structured outline with 5-8 sections:
    - Hook (attention-grabbing)
    - Problem Context
    - Attempt 1 (what failed)
    - Attempt 2 (what worked)
    - Key Insight
    - Results (metrics)
    - CTA
13. Each section has:
    - Key points to cover
    - Tone guidance ("show the 6-hour struggle")
    - Example fragments
14. Start writing in the writing area
15. Follow outline structure, write in own voice
16. Takes ~15 minutes to write 5-tweet thread
17. Click "Save Draft"
```

**5:20 PM - Post to X**
```
18. Click "Post to X" button on draft card
19. Draft status changes to "posted"
20. Badge shows "posted" with timestamp
21. (Future: Will actually post via X API)
22. Alternatively: Copy content, paste on x.com manually
```

**5:22 PM - Repeat for Post #2**
```
23. Back to Ideas Dashboard
24. Select idea #2
25. Get outline → Write content → Post on X
26. Time: ~20 minutes
```

**Total Time:** 60 minutes for 3 posts (vs 150 minutes manually)  
**Time Saved:** 90 minutes

**Note:** Performance tracking removed from MVP. Focus is on learning loop (next flow).

---

## Flow 2: Weekly Setup

**Actor:** Vishesh  
**Goal:** Update context for better ideas  
**Time:** 10 minutes  
**Frequency:** Weekly (Sunday evening)

### Steps

**Update Projects**
```
1. Navigate to Settings → Projects tab
2. See current projects:
   - Portfolio v2 (Active)
   - MCP Experiments (Active)
   - LLM Router (Completed) ← mark as completed
3. Click edit on "Portfolio v2"
4. Update description: "Redesigning with AI agent, adding voice features"
5. Click "+ Add Project"
6. Name: "Jack - X Content Agent"
7. Description: "Building AI agent for X content creation"
8. Status: Active
9. Save changes
```

**Review Creators**
```
10. Navigate to Settings → Creators tab
11. See 87/100 tracked creators
12. Notice @newfounder mentioned by 3 existing creators
13. Click "+ Add Creator"
14. Enter: @newfounder
15. Category: Startup Founder
16. Save
```

**Review Tone Learnings**
```
17. Navigate to Settings → Tone tab
18. See learned patterns:
    - 12 posts analyzed
    - Avg length: 180 chars
    - Success pattern: sharing failures (680 avg engagement)
19. No changes needed (learning automatically)
```

**Total Time:** 10 minutes weekly

---

## Flow 3: Mark Post as "Good" (The Learning Loop)

**Actor:** Vishesh  
**Goal:** Help Jack learn from successful posts  
**Time:** 1 minute  
**Trigger:** Post performed well (user's judgment)  
**Frequency:** After posting content that resonated

### Steps

**Day 2 After Posting**
```
1. Notice MCP debugging thread got 1.2K likes on X (great!)
2. Open Jack
3. Navigate to "My Drafts" (/posts)
4. Use date filter to find the post (default: past 7 days)
5. Find the post: "MCP Server Debugging Patterns"
6. Status shows: "posted" badge with timestamp
7. Click "mark as good" button
8. Badge updates to show "good" status
9. Confirmation: Post is now used for learning
```

**Background Processing (Automatic)**
```
8. Jack updates post.is_marked_good = true in database
9. If 5+ posts marked good, automatically trigger analyzeTone()
10. analyzeTone extracts patterns:
    - Post length: 180 chars average
    - Used phrases: "spent 6 hours", "turns out"
    - Showed failure: yes
    - Included real numbers: yes
    - Content pillar: Lessons Learned
    - Format: Thread (5 tweets)
11. Updates tone_config.learned_patterns in database:
    {
      "avg_post_length": 180,
      "common_phrases": ["spent X hours", "turns out", "saved $Y"],
      "show_failures": true,
      "include_numbers": true,
      "successful_pillars": ["lessons_learned"],
      "preferred_format": "thread"
    }
12. Future ideas will:
    - Prioritize Lessons Learned pillar
    - Suggest thread format
    - Emphasize showing failures
    - Include prompts for time/cost metrics
```

**Visible Impact**
```
13. Dashboard updates: "⭐ Learned from 5 good posts" (was 4)
14. Next idea generation uses these patterns
15. Ideas become more relevant (50% → 80% over 4 weeks)
```

**Total Time:** 1 minute (just one click!)  
**Impact:** Jack gets smarter about YOUR voice

**Note:** This is the core differentiator from ChatGPT. The learning loop makes Jack better over time.

---

## Flow 4: Regenerate Outline (Not Happy with First Version)

**Actor:** Vishesh  
**Goal:** Get better outline with different angle  
**Time:** 3 minutes

### Steps

**Outline Generation**
```
1. Get outline for idea #3
2. Outline appears but angle feels off (too technical?)
3. Click "Regenerate Outline" at bottom
```

**Provide Context**
```
4. Modal appears: "What should we change?"
5. Enter: "focus more on the learning journey, less on technical details"
6. Click "Regenerate"
7. Wait 10 seconds
8. New outline appears with updated angle
```

**Use New Outline**
```
9. New outline emphasizes:
   - The confusion phase
   - Asking for help
   - Breakthrough moment
10. Much better, start writing
```

**Total Time:** 3 minutes

**Note:** Regeneration is optional. Most outlines work on first try (70%+ acceptance rate).

---

## Flow 5: First Time Setup

**Actor:** New User (Self-hosting Jack)  
**Goal:** Configure Jack for first use  
**Time:** 30 minutes

### Steps

**Installation**
```
1. Clone repo: git clone https://github.com/visheshbaghel/experiments
2. cd experiments/packages/jack-x-agent
3. Copy .env.example to .env
4. Add:
   - APIFY_API_TOKEN
   - OPENAI_API_KEY
   - PRISMA_DATABASE_URL (Prisma Postgres with Accelerate)
   - POSTGRES_URL (Direct Postgres connection)
5. Run: pnpm install
6. Run: pnpm db:migrate (create tables)
7. Run: pnpm dev
```

**First Login**
```
8. Navigate to localhost:3000
9. No user exists, redirected to setup
10. Enter email, password
11. Creates user + default tone config
```

**Add Creators**
```
12. Redirected to Settings → Creators
13. Click "+ Add Creator"
14. Can add manually or paste list
15. Paste list of 50 handles (one per line)
16. Categorize each (dropdown)
17. Save
```

**Add Projects**
```
18. Navigate to Settings → Projects
19. Click "+ Add Project"
20. Enter current projects (2-3)
21. Save
```

**Configure Tone**
```
22. Navigate to Settings → Tone
23. Review defaults:
    - [x] Lowercase
    - [ ] Emojis
    - [ ] Hashtags
    - [x] Show failures
24. Adjust if needed (most users keep defaults)
25. Save
```

**Generate First Ideas**
```
26. Navigate to Ideas Dashboard
27. Click "Refresh" (force fetch)
28. Wait 15-20 seconds (first time, no cache)
29. Jack:
    - Fetches 50 creators × 15 posts = 750 posts
    - Caches creator posts
    - Extracts trending topics
    - Caches trends
    - Generates 5 ideas
30. Ideas appear
31. Ready to use!
```

**Total Time:** 30 minutes first time, then <2 min daily

---

## Flow 6: No Ideas Generated (Error Handling)

**Actor:** Vishesh  
**Goal:** Fix issue and get ideas  
**Time:** 5 minutes

### Steps

**Problem Detection**
```
1. Open Jack
2. See: "No ideas generated yet"
3. Click "Generate Ideas"
4. Error appears: "Failed to fetch trending topics"
```

**Troubleshooting**
```
5. Check error details (shown in alert)
6. Possible causes:
   - Apify API token invalid
   - No active creators
   - Network issue
```

**Fix: No Active Creators**
```
7. Navigate to Settings → Creators
8. See: "0 active creators"
9. Realize all creators were marked inactive
10. Select 50 creators
11. Click "Mark as Active"
12. Back to Dashboard
13. Click "Refresh"
14. Ideas generate successfully
```

**Total Time:** 5 minutes

---

## Flow 7: Draft Management (Edit, Delete, Post)

**Actor:** Vishesh  
**Goal:** Manage drafts - edit content, delete unwanted, post to X  
**Time:** 1-2 minutes per action

### Steps

**Edit a Draft**
```
1. Navigate to "My Drafts" (/posts)
2. Find draft to edit
3. Click "edit" button on draft card
4. Textarea appears with current content
5. Make changes to content
6. Click "save" to update
7. Or click "cancel" to discard changes
```

**Delete a Draft**
```
1. Navigate to "My Drafts" (/posts)
2. Find draft to delete
3. Click "delete" button
4. Confirmation dialog appears
5. Confirm deletion
6. Draft is removed from list
```

**Post to X**
```
1. Navigate to "My Drafts" (/posts)
2. Find draft to post
3. Click "post to X" button
4. Draft status changes to "posted"
5. "posted" badge appears with timestamp
6. Edit button becomes disabled
7. (Future: Will integrate with X API)
```

**Filter Drafts by Date**
```
1. Click date filter dropdown (right of tabs)
2. Options: Past 7 days (default), 15 days, Past month, Custom
3. Select desired range
4. List filters to show only drafts in that range
5. Filter persists across page navigation (localStorage)
```

---

## Flow 8: Idea Rejected (Skip)

**Actor:** Vishesh  
**Goal:** Skip irrelevant idea  
**Time:** 5 seconds

### Steps

```
1. See idea #4: "Using Kubernetes for Deployment"
2. Think: "I don't use Kubernetes, not relevant"
3. Click "Skip"
4. Idea status → 'rejected'
5. Idea card fades out
6. Jack learns: you skip Kubernetes topics
7. Future ideas avoid Kubernetes
```

**Total Time:** 5 seconds per skip

---

## Flow 9: Batch Outline Creation (Weekend Planning)

**Actor:** Vishesh  
**Goal:** Get outlines for entire week of content  
**Time:** 1 hour  
**Frequency:** Once per week (Sunday)

### Steps

**Sunday 10 AM**
```
1. Open Jack
2. Generate ideas (5 shown)
3. Get outlines for all 5 ideas
4. Save all outlines
5. Click "Refresh" to get 5 more ideas
6. Get outlines for 4 more (total 9 outlines for 3 days)
```

**Review Outlines**
```
7. Navigate to "My Drafts"
8. See 9 outlines saved
9. Mentally assign to days:
   - Monday: 3 posts
   - Tuesday: 3 posts
   - Wednesday: 3 posts
```

**During Week**
```
10. Monday 8 PM:
    - Open Jack
    - Open outline 1 → Write content → Post on X
    - Mark as "Posted" in Jack
    - Repeat for outlines 2, 3
11. Tuesday-Wednesday: Same pattern
12. Mark successful posts as "good" after 24-48 hours
```

**Total Time:** 1 hour Sunday + 20 min/day during week

**Note:** Batch creation is optional. Can also generate ideas daily as needed.

---

## Flow 10: Analytics & Learning Progress (V2 Feature - Not MVP)

**Purpose:** Track performance metrics and see learning progress

**Note:** Performance tracking and analytics dashboard deferred to V2.

**MVP Alternative:** Learning progress visible through:
- "⭐ Learned from X posts" indicator on dashboard
- Learned patterns shown in Settings → Tone
- Improved idea relevance over time (50% → 80%)

**V2 Will Add:**
- Auto-fetch engagement metrics from X
- Analytics dashboard with charts
- Correlation between topics and engagement
- A/B testing different content approaches

---

## Edge Cases & Error Handling

### Case 1: Apify Rate Limit Hit
```
Flow: Generate Ideas → Apify rate limit
Response:
- Show cached data (if available, <24h old)
- Message: "Using cached data from 8 hours ago"
- Still functional, just not fresh
```

### Case 2: OpenAI API Down
```
Flow: Create Draft → OpenAI fails
Response:
- Retry 2x automatically
- If still fails: show error
- Message: "OpenAI is unavailable. Try again in a few minutes"
- Save idea as "selected" for later retry
```

### Case 3: Invalid Tweet URL
```
Flow: Track Post → Invalid URL
Response:
- Validate URL format client-side
- Show error: "Invalid tweet URL. Format: https://x.com/username/status/123"
- Don't submit to backend
```

### Case 4: No Projects Added
```
Flow: Generate Ideas → No projects context
Response:
- Ideas still generate (based on trends only)
- Banner: "Add current projects for more relevant ideas"
- Link to Settings → Projects
```

### Case 5: Draft Too Long (Thread)
```
Flow: Create Draft → Tweet #3 is 320 characters
Response:
- Highlight in red
- Show warning: "Tweet 3 exceeds 280 characters"
- Provide "Auto-split" button
- Splits into two tweets automatically
```

---

## Performance Expectations

| Action | Expected Time | What Happens |
|--------|---------------|--------------|
| Load Dashboard | <2s | Fetch ideas from DB |
| Generate Ideas (cached) | <3s | Read from cache |
| Generate Ideas (fresh) | 10-15s | Apify fetch + GPT-4 |
| Generate Outline | 10-12s | GPT-4 generation |
| Mark as Good | <1s | DB update + trigger analysis |
| Analyze Tone | 2-3s | Pattern extraction (local) |
| Save Draft | <1s | DB update |
| Page Navigation | <500ms | Client-side routing |

---

## Success Metrics (Per Flow)

**Flow 1 (Daily Creation):**
- Success: Created 3 posts in <65 minutes
- Target: 60% time savings vs manual (150min → 60min)
- Quality: User writes 100% of content

**Flow 3 (The Learning Loop - Core Metric):**
- Success: 5+ posts marked as good within first 2 weeks
- Jack learns patterns and improves idea relevance
- **Target: 50% → 80% idea relevance by week 4**
- User perception: "Jack knows my voice"

**Flow 5 (Setup):**
- Success: New user creates first post within 60 minutes
- Dropout rate: <10%
- All required context configured

**Flow 8 (Batch):**
- Success: 9 outlines created in <1 hour
- Quality: 70%+ outlines used with minor adjustments
- User writes all content during the week

---

## Summary

**MVP Flows (Core):**
1. Daily Content Creation (primary value)
2. Weekly Context Update (maintenance)
3. **Mark Post as Good (learning loop - key differentiator)**
4. Regenerate Outline (quality control)
5. First Time Setup (onboarding)

**Supporting Flows:**
6. Error Handling (no ideas generated)
7. **Draft Management (edit, delete, post to X)**
8. Skip Irrelevant Ideas (feedback)
9. Batch Outline Creation (optional workflow)

**V2 Flows (Deferred):**
10. Performance Analytics (metrics dashboard)

**Core Value:** The learning loop (Flow 3) makes Jack unique vs ChatGPT. Ideas improve from 50% → 80% relevance over 4 weeks.

**New Features (Recent):**
- Date range filters on Ideas and Drafts pages (7d, 15d, 30d, custom)
- Draft edit/delete/post actions
- Posted state tracking for drafts
- Filter persistence via localStorage
- Visitor mode (read-only access for followers to see content process)
- Single-user passphrase authentication

---

## Flow 10: Visitor Mode Experience

**Actor:** Follower, potential client, or curious visitor
**Goal:** See behind the scenes of Vishesh's content creation process
**Time:** 2-5 minutes

### Purpose

Visitor mode exists to:
- **Show authenticity** - followers can see the raw content process
- **Build trust** - transparency about how content is created
- **Demonstrate the tool** - potential users can see Jack in action
- **Portfolio showcase** - proof of building in public

**Note:** Visitor mode must be **enabled by the owner** in settings. By default, it's disabled on first deployment.

### Steps

**Landing on Auth Page (When Visitor Mode is Enabled)**
```
1. Navigate to jack.visheshbaghel.com
2. See auth page with passphrase field
3. Notice "see what i'm cooking" button
4. Click to enter visitor mode
5. Backend verifies owner has enabled visitor mode
6. Guest account exists, access granted
```

**Landing on Auth Page (When Visitor Mode is Disabled)**
```
1. Navigate to jack.visheshbaghel.com
2. See auth page with passphrase field
3. Notice "see what i'm cooking" button
4. Click to enter visitor mode
5. Backend checks: visitor mode disabled
6. Error message: "visitor mode is currently disabled by the owner"
7. Cannot proceed to dashboard
```

**Exploring as Visitor**
```
5. Redirected to Ideas Dashboard
6. See "visitor mode" badge in navigation
7. Browse Vishesh's actual content ideas
8. Can view all pages: ideas, drafts, creators, settings
9. All data shown is real content in progress
```

**Understanding Restrictions**
```
10. Hover over "cook up ideas" button
11. See tooltip: "visitor mode - this is my personal agent. want your own?"
12. See link: "deploy your own jack" → GitHub repo
13. Understand this is read-only, can deploy their own
```

### Visitor Mode Restrictions

| action | allowed | tooltip |
|--------|---------|---------|
| view ideas | yes | - |
| view drafts | yes | - |
| view creators | yes | - |
| view settings | yes | - |
| all write actions | no | "this is my personal agent. want your own? → deploy your own jack" |

All restricted actions show the same simple tooltip with a link to the GitHub repo.

### Success Metrics

- **Engagement:** Visitors view 2+ pages
- **Time on site:** 1-3 minutes average
- **Purpose fulfilled:** Visitors understand the content creation process

---

## Flow 11: Authentication (Single-User Model)

**Actor:** Owner (Vishesh) or visitor  
**Goal:** Access Jack instance

### Why Single-User?

Jack is a **personal tool**, not a SaaS product. The auth model reflects this:
- One owner (you) with full access via passphrase
- Guests can explore via lurk mode (read-only)
- No signup flow - you manually create your user in the DB

### Owner Login Flow

```
1. Navigate to jack.visheshbaghel.com
2. See auth page with passphrase field
3. Enter passphrase (stored in DB, not env var)
4. Click "let me in"
5. If passphrase matches: logged in, full access
6. If wrong: spicy error message (e.g., "nice try, but you're not vishesh")
```

### Rate Limiting

Auth endpoint is rate limited to prevent brute force:
- 5 attempts per minute per IP
- After limit: "slow down speedrunner. try again in Xs"
- Resets after 60 seconds

### Logout Flow

```
1. Click logout icon in navigation
2. Session cleared (cookies + localStorage)
3. Redirected to auth page
```

### Session Management

- Sessions stored in cookies (30-day expiry)
- Guest sessions marked with `isGuest: true`
- Demo user ID stored for guest data access
- Cross-tab sync via localStorage events

### Database Setup (One-Time)

To set up your owner account:

```sql
-- Create owner user with passphrase
INSERT INTO users (email, name, passphrase, is_owner)
VALUES ('your@email.com', 'Your Name', 'your-secret-passphrase', true);
```

Or via Prisma:

```typescript
await prisma.user.create({
  data: {
    email: 'vishesh@example.com',
    name: 'Vishesh',
    passphrase: 'your-secret-passphrase-here',
    isOwner: true,
  }
});
```

**Security notes:**
- Use a strong passphrase (20+ characters)
- Passphrase is stored in plain text (acceptable for single-user)
- Rate limiting protects against brute force
- Never expose passphrase in logs or client code

---

## Flow 12: Owner Managing Visitor Mode

**Actor:** Owner (Vishesh)  
**Goal:** Enable or disable visitor mode to control guest access  
**Time:** 30 seconds

### Purpose

Visitor mode is **owner-controlled**. By default, it's disabled on first deployment for privacy. The owner can enable it when ready to showcase their content creation process.

### Enabling Visitor Mode

```
1. Navigate to Settings (/settings)
2. See "Visitor Mode" section at the top
3. Toggle shows "visitor mode is off"
4. Click the toggle switch
5. Toggle animates to "on" position
6. Message appears: "Visitor mode enabled. Guest account created."
7. Guest access URL displayed: http://jack.visheshbaghel.com/auth
8. "Active" badge appears next to title
```

**What happens behind the scenes:**
- Backend creates guest user with email `guest@localhost`
- Guest user is marked as `isGuest: true` in database
- Owner's `allowVisitorMode` field set to `true`
- Guest login route now allows access

### Disabling Visitor Mode

```
1. Navigate to Settings (/settings)
2. Toggle shows "visitor mode is on"
3. Click the toggle switch
4. Toggle animates to "off" position
5. Message appears: "Visitor mode disabled. Guest account deleted."
6. Guest access URL hidden
7. "Active" badge disappears
```

**What happens behind the scenes:**
- Backend deletes guest user from database
- Owner's `allowVisitorMode` field set to `false`
- Guest login route returns 403 error
- Active guest sessions remain valid until logout

### Guest Login Behavior

**When visitor mode is enabled:**
```
1. Visitor navigates to /auth
2. Clicks "see what i'm cooking" button
3. Backend checks owner's `allowVisitorMode` flag
4. Creates guest session with `demoUserId` pointing to owner
5. Redirects to dashboard showing owner's content
```

**When visitor mode is disabled:**
```
1. Visitor navigates to /auth
2. Clicks "see what i'm cooking" button
3. Backend checks owner's `allowVisitorMode` flag
4. Returns 403 error
5. Shows message: "visitor mode is currently disabled by the owner"
6. Visitor cannot access
```

### Default State

**On first deployment:**
- Visitor mode is **disabled by default**
- No guest account exists
- Owner must explicitly enable it in settings
- Provides privacy until owner is ready to showcase

**Security considerations:**
- Only owner can toggle visitor mode (guests blocked)
- Guest account is created/deleted automatically
- Guest sessions are read-only (all write operations blocked)
- Guest cannot access owner's passphrase or sensitive data

### Success Metrics

- **Owner control:** 100% success rate for toggle operations
- **Privacy:** No guest access until explicitly enabled
- **Reliability:** Guest account creation/deletion succeeds every time
- **Security:** No guest can modify owner's data

---

## Flow 13: Configure Tweet Scraping (Dynamic Tweet Limits)

**Actor:** Vishesh (Owner)
**Goal:** Control how many tweets to scrape from each creator
**Time:** 2-3 minutes

### Context

User wants to control the "influence" of different creators on their content ideas by adjusting how many tweets to scrape from each.

- Creator A posts valuable long-form threads → want 20 tweets/day
- Creator B posts frequently but only occasional gems → want 5 tweets/day
- Global limit prevents excessive API costs

### Steps

**Navigate to Creators Page**
```
1. Click "creators" in navigation
2. See list of tracked creators
3. See "daily tweet budget" card at top
4. Shows: "total requested: 30/50"
5. Green indicator: "✓ within budget - no scaling needed"
```

**Adjust Global Daily Limit**
```
6. See current daily limit: 50 tweets
7. Click on input field, change to 100
8. "save" button appears next to input
9. Click "save"
10. Loading state: "saving..."
11. Success toast: "daily limit updated"
12. Button disappears, value saved
```

**Configure Per-Creator Tweet Count**
```
13. Scroll to creator: @levelsio
14. See current value: 10 tweets
15. Change input to 20 tweets
16. "save" button appears to the right
17. Click "save"
18. Loading state: "saving..."
19. Success toast: "tweet count updated"
20. New value persists
```

**Observe Proportional Scaling**
```
21. Configure multiple creators:
    - @levelsio: 40 tweets
    - @swyx: 30 tweets
    - @Naval: 25 tweets
    - Total: 95 tweets
22. Daily limit: 50 tweets
23. Amber warning appears: "⚠ proportional scaling active (53% per creator)"
24. See scaled values beside each input:
    - @levelsio: "(scaled to 21)" 40 tweets
    - @swyx: "(scaled to 16)" 30 tweets
    - @Naval: "(scaled to 13)" 25 tweets
25. Total scraped will be: 50 tweets (not 95)
```

**Understanding Scaling Algorithm**
```
26. System calculates:
    - Total requested: 95 tweets
    - Daily limit: 50 tweets
    - Scaling factor: 50/95 = 0.526
    - Each creator gets: floor(requested × 0.526)
    - Minimum 1 tweet per active creator guaranteed
27. Actual scraping uses scaled values
28. User sees both requested and actual values
```

**Pause Creator to Remove from Scaling**
```
29. Click "chill" button on @Naval
30. Creator marked inactive (gray dot)
31. Tweet count input disappears
32. Recalculation:
    - New total: 70 tweets (40 + 30)
    - Daily limit: 50 tweets
    - New scaling factor: 50/70 = 0.714
    - @levelsio: floor(40 × 0.714) = 28 tweets
    - @swyx: floor(30 × 0.714) = 21 tweets
33. Scaling message updates with new percentages
```

**Re-activate Creator**
```
34. Click "chill" again on @Naval
35. Creator marked active (green dot)
36. Tweet count input reappears with saved value (25)
37. Scaling recalculates back to 95 total
```

### Technical Implementation

**Backend (Cron Job)**
```
1. Daily cron runs at scheduled time
2. For each user:
   a. Fetch user's dailyTweetLimit from DB
   b. Fetch all active creators with tweetCount
   c. Calculate total requested tweets
   d. If total > dailyLimit:
      - Calculate scaling factor: dailyLimit / total
      - Apply to each creator: actualCount = max(1, floor(requested × factor))
   e. For each creator:
      - Scrape actualCount tweets using Twitter API/Apify
      - Store in database
      - Update lastScrapedAt timestamp
3. Use scraped tweets for trend analysis
4. Generate content ideas based on scraped content
```

**API Endpoints**
```
PATCH /api/users/[id]/settings
Body: { dailyTweetLimit: 100 }
Validation: Min 1, Max 1000

PATCH /api/creators/[id]
Body: { tweetCount: 20 }
Validation: Min 1, Max 100
```

**UX Details**
```
- Pending state pattern: save button only appears when value changes
- Instant UI feedback: no API call on every keystroke
- Live calculation: total and scaling updates in real-time
- Color indicators:
  - Green ✓ = within budget
  - Amber ⚠ = proportional scaling active
- Scaling message placement: LEFT of input (not right)
```

### Edge Cases

**All Creators Paused**
```
1. User clicks "chill" on all creators
2. No active creators
3. Total requested: 0 tweets
4. Message: "no active creators to scrape"
5. Scraping skipped in cron job
```

**Single Creator Requesting More Than Limit**
```
1. User has 1 active creator: @levelsio
2. Requests: 100 tweets
3. Daily limit: 50 tweets
4. Scaling applies: actualCount = 50 tweets
5. Shows: "(scaled to 50)" 100 tweets
```

**Minimum Tweet Guarantee**
```
1. User has 10 active creators
2. Each requests: 10 tweets (Total: 100)
3. Daily limit: 5 tweets
4. Scaling factor: 5/100 = 0.05
5. Normal calculation: 10 × 0.05 = 0.5 → floor = 0
6. Minimum guarantee kicks in: max(1, 0) = 1
7. Each creator gets: 1 tweet
8. Total scraped: 10 tweets (exceeds limit for fairness)
```

### Success Metrics

- **Configuration time:** < 3 minutes to adjust all creator tweet counts
- **Understanding:** User immediately sees scaling impact in UI
- **API cost control:** Total tweets scraped never significantly exceeds daily limit (except minimum guarantee edge case)
- **Fairness:** All active creators get at least 1 tweet
- **Predictability:** Scaling calculation is transparent and consistent

---
