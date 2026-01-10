# Jack - X Content Agent Specification

> "because writer's block is for normies"

**Version:** 0.1.0 (MVP)  
**Author:** Vishesh Baghel  
**Last Updated:** Dec 7, 2025  
**Status:** Draft - Pre-Implementation (Architecture Revised)

### Why "Jack"?

Named after **Jack Dorsey**, founder of Twitter (now X). The name pays homage to the platform's origins while embodying the spirit of a creator who ships content relentlessly.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Non-Goals](#goals--non-goals)
3. [User Stories](#user-stories)
4. [Architecture Overview](#architecture-overview)
5. [Success Criteria](#success-criteria)
6. [Technical Stack](#technical-stack)
7. [Cost Analysis](#cost-analysis)
8. [Timeline & Milestones](#timeline--milestones)

### Detailed Specs (Separate Files)
- [Data Models](./specs/DATA_MODELS.md)
- [Mastra Agent](./specs/MASTRA_AGENT.md)
- [UI Design](./specs/UI_DESIGN.md)
- [User Flows](./specs/USER_FLOWS.md)
- [Tone Guidelines](./specs/TONE_GUIDELINES.md)
- [Personality](./specs/PERSONALITY.md) - Jack's grind bro persona and UI copy guidelines

---

## Problem Statement

### Current Pain Points

**Time Investment**

**Current state (manual):**
- Research trending topics: 15 minutes
- Brainstorm ideas: 10 minutes
- Write content: 20 minutes
- Post to X: 5 minutes
- **Total per post:** 50 minutes
- **Daily (3 posts):** 150 minutes

**With Jack:**
- Review generated ideas + outlines: 3 minutes
- Write content from outline: 15 minutes
- Post to X: 2 minutes
- **Total per post:** 20 minutes
- **Daily (3 posts):** 60 minutes

**Time saved:** 90 minutes/day = 10.5 hours/week

**Consistency Challenge:**
- Need to post 3x/day for growth
- Hard to maintain quality + frequency with day job
- Difficult to track what content works

**Content Quality:**
- Need authentic tone (lowercase, technical, humble)
- Must tell my story (CS degree, building in public)
- Balance value content (80%) vs promotion (20%)

### Vision

Jack is an AI agent that reduces content creation time from 50 min to **20 min per post** while maintaining authenticity and improving engagement.

**Time Savings:** 30 min/post × 3 posts/day = **90 min/day saved**

---


## Goals & Non-Goals

### V1 (MVP - 4 weeks)

**Content Discovery**
- Track 50-100 X creators (user-specified)
- **Dynamic tweet scraping** with per-creator configuration:
  - Each creator has configurable tweet count (1-100 tweets/day)
  - Global daily tweet limit (1-1000 tweets across all creators)
  - Proportional scaling when total requested > daily limit
  - Minimum 1 tweet per active creator guaranteed
- Fetch trending topics daily (24h cache)
- Generate 5 content ideas based on:
  - Trending topics from tracked creators
  - User's active projects
  - User's learned tone patterns

**Content Ideation**
- Generate structured outlines for selected ideas
- User writes actual content manually
- Validate tone guidelines in outline examples

**The Learning Loop (Core Value)**
- Mark posted content as "good" (one-click)
- Analyze patterns from good posts (length, phrases, structure)
- Update learned tone patterns automatically
- Show "learned from X posts" indicator
- Improve idea relevance over time (50% → 80%)

**Usability**
- Simple web UI (no calendar, no complexity)
- **Responsive navigation** with mobile hamburger menu
  - Desktop (≥768px): horizontal navigation bar
  - Mobile (<768px): hamburger menu with slide-in drawer
- Minimalist design matching "jack" aesthetic (no "content agent" subtitle)
- Save drafts for editing
- Manual posting (no X API integration)

**Authentication (Single-User Model)**
- Passphrase-based auth for owner (you)
- Guest mode for portfolio visitors (read-only)
  - **Owner-controlled:** Enable/disable via settings toggle
  - **Default:** Disabled on first deployment
  - **Guest email:** `guest@localhost`
  - **When enabled:** Creates guest account automatically
  - **When disabled:** Deletes guest account automatically
  - Guests see owner's content via `demoUserId`
- No signup flow - single user tool, not SaaS
- Rate limiting on auth endpoint (5 attempts/minute)

### V2 (Post-MVP)

- **Performance Tracking**: Auto-fetch metrics from posted tweets
- **Analytics Dashboard**: Which content types perform best
- **Advanced Learning**: Correlation between topics and engagement
- Direct X API integration (auto-posting)
- Writing assistant for content composition
- Content templates library
- Multi-user support
- Export content to Notion/Obsidian

---

## User Stories

### Primary User Story (MVP Core Value)

**As a content creator building an X presence,**

I want an AI agent that:
1. **Learns MY specific voice** from my successful posts
2. **Keeps me inspired** by tracking what top creators in my space are discussing
3. **Generates relevant ideas** combining trending topics with my projects

**So that** I can create authentic, engaging content consistently without starting from a blank page each time.

**Unlike ChatGPT/Claude:**
- ❌ They forget context and start fresh each session
- ❌ They give generic ideas not tailored to X or my niche
- ✅ Jack learns from feedback and improves idea relevance from 50% → 80% over 4 weeks
- ✅ Jack is specialized for X content with creator insights

---

### Core User Flows (MVP)

#### 1. Daily Content Creation

**As a user**, I want to:
1. Open Jack and see 5 content ideas inspired by top creators
2. Ideas reference trending topics I care about
3. Click an idea to see structured outline
4. Write content based on outline in my voice
5. Post on X manually

**Acceptance Criteria:**
- Ideas generated in <10s
- Ideas reference specific trending topics
- Outlines provide clear structure
- 70%+ of outlines used with minor edits

#### 2. The Learning Loop (Key Differentiator)

**As a user**, I want to:
1. Mark posts that performed well as "good"
2. Jack analyzes patterns in those posts
3. Future ideas match my successful style more closely
4. See measurable improvement in idea relevance

**Acceptance Criteria:**
- One-click "mark as good" from UI
- Jack shows "learned from X posts" indicator
- Idea relevance increases from 50% → 80% by week 4
- Learned patterns visible in tone config

#### 3. Context Management

**As a user**, I want to:
1. Configure my base tone (lowercase, honest, technical)
2. Add/update current projects I'm working on
3. Manage list of top creators to track (50-100)
4. See what topics are trending among those creators

**Acceptance Criteria:**
- Tone config saved and persisted
- Projects easily added/updated
- Creator list managed from UI
- Trending topics cached for 24h

#### 4. Writing Development

**As a user**, I want to:
1. Use outlines as structure, not crutch
2. Develop my own writing voice
3. Improve articulation skills over time
4. Maintain authenticity (not AI-generated)

**Acceptance Criteria:**
- Outlines provide structure, not full content
- User writes 100% of actual posts
- User feels more confident writing over 4 weeks

---

## Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────┐
│    Next.js 15 App (Single Vercel Deploy)        │
│                                                 │
│  Frontend: React + TailwindCSS + shadcn/ui      │
│         ↓                                       │
│  API Routes (Deterministic Logic):              │
│  • /api/topics        → Fetch + cache trending  │
│  • /api/posts/track   → Apify metrics + DB      │
│  • /api/tone/analyze  → SQL pattern extraction  │
│         ↓                                       │
│  /api/agent (AI Generation):                    │
│    → Mastra Agent (embedded)                    │
│    → generateIdeas(context)                     │
│    → generateOutline(ideaId)                    │
│    → Memory for user context                    │
│    → Evals for quality checks                   │
│         ↓                                       │
│  Database Layer:                                │
│  • Prisma ORM                                   │
│  • Postgres (Neon) + Mastra Memory Store        │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│      External Services                          │
│                                                 │
│  • TwitterAPI.io (Primary) → Cost-effective scraping ($0.00015/tweet) │
│  • Apify (Backup)          → Alternative scraper (kept for resilience) │
│  • OpenAI ($10/mo)         → GPT-4 generation   │
│  • Neon (Free)             → Postgres database  │
│  • Langfuse (Free)         → LLM observability  │
└─────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **TwitterAPI.io over Apify (Cost Optimization):**
   - TwitterAPI.io: $0.00015/tweet (94% cheaper than Apify)
   - Apify kept as backup for resilience
   - Generic scraper interface allows easy provider switching
   - See `docs/TWITTERAPI_IO_INTEGRATION.md` for full details

2. **Balanced Tweet Sampling (Idea Quality):**
   - Fetches tweets evenly across all tracked creators
   - Prevents bias toward high-frequency posters
   - Example: 3 creators, 50 tweet limit → ~17 tweets per creator
   - Shuffles to mix creator perspectives
   - Ensures diverse content for idea generation

3. **Tweet Cleanup Cron (Cost Optimization):**
   - Daily cleanup of tweets older than 7 days
   - Runs at 3 AM UTC (1 hour after scraping)
   - 98% reduction in database storage vs 90-day retention
   - Ideas generated daily, older tweets have diminishing value
   - Helps stay within Neon free tier (500MB limit)

4. **No Vector DB (MVP):** Simple keyword matching sufficient for 100 creators
   - 24-hour cache reduces repeated API calls
   - Can add semantic search later if needed

5. **Single-User SaaS:** Each user deploys their own instance
   - Simpler MVP (no multi-tenancy)
   - Full data control
   - Lower hosting costs

6. **Postgres over MongoDB:**
   - Structured data with relationships
   - JSONB for flexible config
   - Better TypeScript support
   - Free tier sufficient (500MB)

7. **Mastra Embedded (Not Separate Deployment):**
   - Agent runs in Next.js app (not Mastra Cloud)
   - Simpler: single Vercel deployment
   - Still use Mastra primitives: Memory, Evals, Structured Generation
   - Easier for open source users to deploy

8. **Outline Generation (Not Full Drafts):**
   - User writes actual content (improve writing skills)
   - AI provides structure and direction
   - Maintains authenticity
   - Not just delegating to AI

9. **Test-Driven Development:**
   - Write tests before implementation
   - Ensures reliability and predictability
   - Easier to refactor and extend

### AI Functions (Mastra Agent)

1. **generateIdeas(context)** - Create 5 ideas based on trends + projects + learned tone
2. **generateOutline(ideaId)** - Generate structured outline for selected idea

### Deterministic Functions (API Routes)

1. **fetchTrendingTopics** - Analyze 50-100 creators via Apify, cache 24h (MVP)
2. **analyzeTone** - Extract patterns from marked "good" posts (MVP)
3. **trackPerformance** - Fetch metrics from tweet URL via Apify (V2, not MVP)

See [Mastra Agent Spec](./specs/MASTRA_AGENT.md) for details.

---

## Success Criteria

### Time Savings (Primary Metric)
- **Baseline:** 50 min per post (research 15min + writing 20min + posting 5min + other 10min)
- **Target:** 20 min per post (review 3min + writing 15min + posting 2min)
- **Success:** 60% reduction in content creation time

### Content Quality
- **Outline Usability:** 70%+ of generated outlines used with minor adjustments
- **Idea Relevance (Week 1):** 5/10 baseline
- **Idea Relevance (Week 4):** 8/10 after learning loop
- **Writing Improvement:** User feels more confident writing over time

### Reliability
- **Idea Generation:** <10s response time
- **Outline Creation:** <15s response time
- **Uptime:** 99% availability (Vercel + Neon)

### Learning (Core Metric)
- **Tone Improvement:** Measured by reduced outline edits over 4 weeks
- **Idea Relevance Growth:** 50% → 80% from week 1 to week 4
- **Pattern Recognition:** Jack learns 5+ patterns per 5 good posts
- **User Perception:** "Jack knows my voice" by week 4

---

## Technical Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS + shadcn/ui
- **State:** React hooks (no complex state management needed for MVP)
- **Deployment:** Vercel

### Backend
- **Agent Framework:** Mastra (embedded)
- **Runtime:** Node.js 20+
- **Deployment:** Vercel (single deployment)

### Database
- **Primary:** Postgres (Neon free tier - 500MB)
- **Why:** Structured data, JSONB support, free tier sufficient

### External Services
- **X Data:** Apify (X scraping - $5/month for 50k results)
- **AI:** OpenAI GPT-4 (~$10/month estimated)
- **Hosting:** Vercel (free tier) + Neon (free tier)

### Development
- **Language:** TypeScript
- **Package Manager:** pnpm (monorepo with experiments)
- **Testing:** Vitest + Playwright (add after MVP)
- **Linting:** ESLint + Prettier

---

## Cost Analysis

### Monthly Operating Costs (MVP)

```
Apify:          $5   (50k results - 100 creators × 30 days × 15 posts/creator = 45k)
OpenAI:         $10  (3 generations/day × 30 days × ~$0.10 avg)
Neon DB:        $0   (Free tier - 500MB sufficient)
Vercel:         $0   (Free tier)
──────────────────
Total:          $15/month
```

### Scaling Considerations

**If tracking 500 creators:**
- Apify: $20/month (200k results)
- OpenAI: Same ($10/month)
- **Total: $30/month**

**If auto-posting (future):**
- X API: $100/month (Basic tier)
- **Total: $115/month**

### Cost Comparison

**Jack (Self-hosted):** $15/month  
**Typical SaaS alternatives:** $29-99/month  
**Savings:** $14-84/month ($168-1,008/year)

---

## Timeline & Milestones

### Week 1: Foundation (Nov 14-20)
- [x] Spec complete and reviewed
- [ ] Project setup (Next.js + Mastra)
- [ ] Database schema created
- [ ] Basic auth (simple password for MVP)
- [ ] Initial UI shell

### Week 2: Core Features (Nov 21-27)
- [ ] Apify integration (TDD)
- [ ] Trending topics caching
- [ ] Mastra agent embedded setup
- [ ] Idea generation function
- [ ] Ideas Dashboard UI
- [ ] Manual creator management

### Week 3: Content Generation (Nov 28 - Dec 4)
- [ ] Outline generation function (TDD)
- [ ] Tone validation evals
- [ ] Outline viewer UI
- [ ] Content writing interface
- [ ] Copy to clipboard

### Week 4: Learning Loop & Polish (Dec 5-11)
- [ ] Mark as "good" feature (one-click from drafts list)
- [ ] analyzeTone function (pattern extraction)
- [ ] Learning indicators UI ("learned from X posts")
- [ ] Show learned patterns in tone config
- [ ] Testing + bug fixes

### Week 5: Launch (Dec 12-18)
- [ ] Deploy to Vercel (single deployment)
- [ ] Setup Langfuse observability
- [ ] Documentation for open source
- [ ] First use in production
- [ ] Share on X

### Post-Launch Iterations
- **Week 6-8:** Use daily, collect feedback, fix issues
- **Week 9-10:** Add most-requested features
- **Week 11-12:** Share learnings, document for others

---

## Open Questions & Decisions Needed

### Pre-Development

1. **Authentication:** Simple password or proper auth? (Recommend: Simple password for MVP)
2. **Initial creator list:** Do you have the 100 creator handles ready?
3. **Apify account:** Should I help set up or you'll handle it?
4. **OpenAI API key:** Existing or new account?

### During Development

5. **Tone samples:** Can you provide 10-15 example posts you like?
6. **Content pillars:** Use the 5 from strategy doc or customize?
7. **Deployment domain:** jack.visheshbaghel.com or custom?

### Post-MVP Features (Priority?)

8. **Analytics depth:** Basic counts or detailed insights?
9. **Export functionality:** Export drafts as markdown?
10. **Collaboration:** Share drafts for feedback?

---

## Next Steps

1. **Review this spec** - Confirm all requirements are captured
2. **Answer open questions** - Fill in missing decisions
3. **Setup accounts** - Apify, OpenAI (if new)
4. **Start development** - Begin with Week 1 foundation

---

## References

- [X Content Strategy](/home/vishesh.baghel/Documents/workspace/strategy-docs/X_CONTENT_STRATEGY.md)
- [Example Thread](/home/vishesh.baghel/Documents/workspace/strategy-docs/X_THREAD.md)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [Mastra Docs](https://mastra.ai/docs)
