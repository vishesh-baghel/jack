# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Jack is an AI-powered X (Twitter) content agent that learns from your successful posts to generate personalized content ideas and outlines. Built with Next.js 15, Mastra AI framework, and Prisma with PostgreSQL.

**Core Value Proposition:** Unlike generic AI, Jack learns from YOUR successful posts over time (50% → 80% idea relevance improvement in 4 weeks) and generates ideas based on trending topics from creators you follow.

## Essential Commands

### Development
```bash
pnpm dev                 # Start Next.js dev server (localhost:3000)
pnpm build              # Build for production (includes Prisma generate + migrate)
pnpm start              # Run production build
```

### Database
```bash
pnpm db:generate        # Generate Prisma client
pnpm db:migrate         # Run migrations in dev
pnpm db:push            # Push schema without migration
pnpm db:studio          # Open Prisma Studio
```

### Testing
```bash
pnpm test               # Run all tests once
pnpm test:watch         # Run tests in watch mode
pnpm test:unit          # Run only unit tests (__tests__/unit)
pnpm test:integration   # Run only integration tests (__tests__/integration)
pnpm test:ci            # Run tests with coverage
```

### Linting
```bash
pnpm lint               # Run ESLint
```

## Architecture

### Core System Flow

1. **Content Discovery** → Scrape tweets from tracked creators (TwitterAPI.io primary, Apify backup)
2. **Idea Generation** → Mastra agent analyzes trends + user projects + learned patterns → generates 3-5 ideas
3. **Outline Generation** → User selects idea → agent generates structured outline
4. **User Writes** → User writes actual content (Jack provides structure, not full content)
5. **Learning Loop** → User marks good posts → pattern analyzer extracts style → future ideas improve

### Key Components

#### Mastra Agent (`lib/mastra/`)
- **agent.ts**: Main Jack agent with two core functions
  - `generateIdeas()`: Creates 3-5 content ideas from context (trends, projects, learned patterns)
  - `generateOutline()`: Generates structured outline for selected idea
- **pattern-analyzer.ts**: Analyzes good posts to extract writing patterns (length, phrases, structure)
- **prompts.ts**: System prompts for idea and outline generation
- **schemas.ts**: Zod schemas for structured AI outputs
- **context.ts**: Builds context for agent from DB (projects, tone config, good posts)

#### Database Layer (`lib/db/`)
Each file provides typed CRUD operations for a Prisma model:
- **users.ts**: User management (owner/guest distinction)
- **creators.ts**: Twitter creators to track
- **creator-tweets.ts**: Scraped tweets from creators
- **projects.ts**: User's active projects (context for idea generation)
- **content-ideas.ts**: Generated ideas (status: suggested/selected/rejected)
- **outlines.ts**: Generated outlines for ideas
- **drafts.ts**: User-written content
- **posts.ts**: Published posts with "good" marking
- **tone-config.ts**: User's voice configuration + learned patterns
- **pattern-learning.ts**: Triggers automatic pattern analysis when posts marked good

#### Scraper Abstraction (`lib/scrapers/`)
- **types.ts**: Generic `TwitterScraper` interface
- **factory.ts**: Returns correct scraper based on env (TwitterAPI.io preferred)
- **twitterapi-scraper.ts**: Primary scraper ($0.00015/tweet)
- **apify-scraper.ts**: Backup scraper (kept for future use)

#### API Routes (`app/api/`)
- `/ideas` - CRUD for content ideas
- `/ideas/generate` - POST to generate new ideas via Mastra agent
- `/outlines/generate` - POST to generate outline for idea
- `/posts` - CRUD for posts + marking as "good"
- `/creators` - CRUD for tracked creators
- `/tone-config` - User voice configuration
- `/drafts` - Save/retrieve written content
- `/auth` - Login, signup (controlled by ALLOW_SIGNUP), guest mode
- `/cron` - Scheduled jobs (authenticated via CRON_SECRET)

### Database Schema Key Points

- **User**: Single owner + optional guests (isOwner flag, guest mode controlled by allowVisitorMode)
- **ToneConfig**: Per-user config + `learnedPatterns` JSON field (populated by pattern analyzer)
- **Post.isMarkedGood**: Triggers pattern learning (3+ needed for analysis)
- **Creator.tweetCount**: Number of tweets to scrape per creator per day
- **CreatorTweet**: Cached tweets with metrics (avoid re-scraping)
- **ContentIdea.status**: `suggested` → `selected` → draft created → posted
- All user data cascades on delete

### Environment Variables

Required in `.env`:
- `DATABASE_URL`: Neon pooled connection (with `-pooler` in hostname)
- `DATABASE_URL_UNPOOLED`: Direct connection for migrations (no `-pooler`)
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway key (optional, falls back to direct OpenAI)
- `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_BASE_URL`: LLM observability
- `TWITTERAPI_IO_KEY`: Primary scraper (twitterapi.io)
- `APIFY_API_KEY`: Backup scraper
- `CRON_SECRET`: Auth for cron endpoints
- `ALLOW_SIGNUP`: Feature flag (unset = auto-disable after owner created)

### Observability

Langfuse integration in `lib/observability/langfuse.ts`:
- Traces for idea generation (input: context, output: ideas)
- Traces for outline generation (input: idea + context, output: outline)
- Pattern learning traces (input: good posts, output: patterns)

## Important Patterns

### The Learning Loop
1. User marks post as "good" (POST `/api/posts/[id]/mark-good`)
2. Triggers `triggerPatternLearning()` in `lib/db/pattern-learning.ts`
3. Fetches 20 recent good posts via `getGoodPostsForLearning()`
4. Calls `analyzeGoodPosts()` in `lib/mastra/pattern-analyzer.ts`
5. LLM extracts patterns (length, phrases, structure, topics)
6. Updates `ToneConfig.learnedPatterns` JSON field
7. Future `generateIdeas()` calls include learned patterns in context

### Scraper Switching
Use `createScraper()` from `lib/scrapers/factory.ts` to get the active scraper. It checks:
1. If `TWITTERAPI_IO_KEY` exists → returns TwitterAPI scraper
2. Else if `APIFY_API_KEY` exists → returns Apify scraper
3. Else throws error

### Mastra AI Gateway Support
Agent uses Vercel AI Gateway if `AI_GATEWAY_API_KEY` is set:
- Model string: `vercel/openai/gpt-4o` (via gateway)
- Fallback: `openai/gpt-4o` (direct OpenAI)

### Single-User Design
- One "owner" user per deployment (`isOwner: true`)
- Optional guest/visitor mode (`allowVisitorMode` flag)
- Signup disabled after owner created (unless `ALLOW_SIGNUP=true`)

## Testing Strategy

- Unit tests in `__tests__/unit/` (excluded from default `pnpm test`)
- Integration tests in `__tests__/integration/` (excluded from default `pnpm test`)
- Default test runs unit tests only
- Environment: happy-dom (lightweight DOM for React components)
- Setup file: `vitest.setup.ts`

## Key Design Decisions

### Why No X API for Posting?
X API costs $100/month (Basic tier). Manual posting is fine for MVP. Validate tool usefulness before expensive API.

### Why No Vector DB?
100 creators × 15 posts = 1,500 posts max. Simple keyword matching + 24-hour cache sufficient. Can add semantic search later if needed.

### Why Postgres + JSONB?
- Structured relational data (users, posts, creators)
- Flexible config via JSONB (learnedPatterns, metrics)
- Neon free tier (500MB) sufficient
- Better TypeScript support than MongoDB

### Why TwitterAPI.io over Apify?
- Cost: $0.00015/tweet vs Apify's $5/month for limited credits
- Direct API vs actor-based workflow
- Kept Apify as backup for resilience

## Common Workflows

### Adding a New Creator to Track
1. POST `/api/creators` with `{ xHandle: "username", tweetCount: 10 }`
2. Scraper validates handle via `validateHandle()`
3. Stores `twitterUserId` if valid
4. Cron job fetches tweets daily

### Generating Ideas
1. GET `/api/tone-config` to ensure user has config
2. POST `/api/ideas/generate`
3. Backend calls `buildIdeaContext()` from `lib/mastra/context.ts`
4. Context includes: projects, tone config, learned patterns, good posts, recent creator tweets
5. Calls `generateIdeas()` from `lib/mastra/agent.ts`
6. Returns 3-5 structured ideas

### Creating an Outline
1. User selects idea (status → `selected`)
2. POST `/api/outlines/generate` with `{ ideaId }`
3. Backend calls `buildOutlineContext()`
4. Calls `generateOutline()` from agent
5. Returns structured outline (format, sections, tone reminders)

### The Learning Workflow
1. User writes content → saves to Draft
2. User posts on X → marks post as "good" in Jack
3. POST `/api/posts/[id]/mark-good` sets `isMarkedGood: true`
4. `triggerPatternLearning()` runs (if 3+ good posts exist)
5. Pattern analyzer extracts patterns
6. Updates `ToneConfig.learnedPatterns`
7. Next idea generation uses learned patterns

## Path Aliases

Uses TypeScript path alias `@/` → repository root
```typescript
import { prisma } from '@/lib/db/client';
import { jackAgent } from '@/lib/mastra/agent';
```

## Deployment Notes

- Vercel deployment (free tier)
- Build command runs `prisma generate && prisma migrate deploy && next build`
- Requires Neon database (free tier)
- Set all env vars in Vercel dashboard
- Cron jobs require `CRON_SECRET` header for auth
