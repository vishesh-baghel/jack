# Jack - X Content Agent

> AI agent that learns YOUR voice from YOUR successful posts, generates ideas inspired by top creators, so you write authentic content faster

**Status:** MVP Complete
**Cost:** ~$15/month to run
**Deployment:** Single Next.js app (Vercel)

---

## The Problem

Creating consistent, quality X content is time-consuming:
- **15 min** researching trending topics
- **10 min** brainstorming ideas
- **20 min** writing each post
- **3 posts/day** = **150 minutes daily**

Plus: Hard to maintain authentic voice, track what works, stay consistent with a day job, and improve writing skills.

---

## The Solution

Jack reduces content creation from **50 min to 20 min per post** by:
- Learning from YOUR successful posts (key differentiator)
- Generating ideas inspired by top creators in your space
- Creating structured outlines (YOU write the content)
- Improving idea relevance from 50% to 80% over 4 weeks
- Helping you improve writing skills (not replacing them)

**Time Savings:** 90 minutes/day = 10.5 hours/week = 42 hours/month

---

## Why Not Just Use ChatGPT?

**ChatGPT/Claude:** Generic AI that forgets context between sessions

**Jack:** Specialized X content agent with a learning loop

| Feature | ChatGPT | Claude | Jack (MVP) |
|---------|---------|--------|------------|
| Generate ideas | Yes | Yes | Yes |
| Use context | Yes (manual paste) | Yes (manual paste) | Yes (saved) |
| **Learn from YOUR posts** | No | No | **Yes** |
| **Improve over time** | No | No | **Yes** |
| **Inspired by top creators** | No | No | **Yes** |
| **Specialized for X** | No | No | **Yes** |

**The Learning Loop:**
1. Week 1: Generate ideas, mark 3 posts as "good"
2. Week 2: Jack analyzes patterns, future ideas match your style
3. Week 4: Idea relevance improves from 50% to 80%

**You can't get this with general-purpose ChatGPT.**

---

## Key Features (MVP)

### 1. Content Discovery
- Tracks 100 creators you specify
- Fetches trending topics daily (via TwitterAPI.io)
- Identifies content gaps
- Suggests 5 ideas matched to your projects

### 2. Content Ideation
- Generates structured outlines for selected ideas
- YOU write the actual content (improve writing skills)
- Includes storytelling guidance (your journey, struggles, lessons)
- Validates tone in examples (no emojis, lowercase, etc.)

### 3. The Learning Loop (Core Value)
- **Mark successful posts as "good"** with one click
- Jack analyzes patterns (length, phrases, structure, topics)
- Future ideas match your successful style more closely
- **Idea relevance improves 50% to 80% over 4 weeks**
- See "Learned from X posts" indicator

### 4. Simplicity
- Clean web UI (no calendar complexity)
- Manual posting (no X API needed for MVP)
- Single-user deployment (Vercel)
- 24-hour caching (reduces costs)

---

## Tech Stack

**Frontend:** Next.js 16 + TailwindCSS + shadcn/ui
**Backend:** Mastra agent (embedded in Next.js)
**Database:** Postgres (Neon - free tier)
**External APIs:**
- TwitterAPI.io ($0.00015/tweet for X data)
- OpenAI GPT-4 (~$10/month for generation)
- Langfuse (free - LLM observability)

**Deployment:**
- Single deployment: Vercel (free tier)

**Total Cost:** $15/month

---

## Quick Start

### Prerequisites
- Node.js 20+
- Postgres database (Neon free tier)
- TwitterAPI.io API key
- OpenAI API key

### Installation
```bash
# Clone repo
git clone https://github.com/visheshbaghel/experiments
cd experiments/packages/jack-x-agent

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Add: TWITTERAPI_IO_KEY, OPENAI_API_KEY, DATABASE_URL

# Create database tables
pnpm db:migrate

# Start development server
pnpm dev
```

### First Use
1. Navigate to `localhost:3000`
2. Create account (email + password)
3. Add 50-100 creator handles
4. Add current projects
5. Configure tone (defaults are good)
6. Generate first ideas (takes 15s first time)
7. Select idea, get outline, write content, post on X, track!

---

## Project Structure

```
jack-x-agent/
├── SPEC.md                     # Main specification
├── CLAUDE.md                   # AI assistant guidance
├── specs/
│   ├── TONE_GUIDELINES.md      # How Jack writes like you
│   ├── DATA_MODELS.md          # Database schema + types
│   ├── MASTRA_AGENT.md         # Agent tools + prompts
│   ├── UI_DESIGN.md            # Page layouts + components
│   └── USER_FLOWS.md           # Complete user journeys
├── src/
│   ├── app/                    # Next.js app router
│   ├── lib/
│   │   ├── mastra/             # Mastra agent
│   │   ├── db/                 # Prisma database layer
│   │   └── scrapers/           # Twitter data scrapers
│   └── components/             # React components
└── prisma/
    └── schema.prisma           # Database schema
```

---

## Development Commands

```bash
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm test                   # Run all tests
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests only
pnpm test:e2e               # E2E tests (Playwright)
pnpm db:migrate             # Run database migrations
pnpm db:studio              # Open Prisma Studio
```

---

## Design Decisions

### Why No X API?
- X API costs $100/month (Basic tier)
- Manual posting is fine for MVP
- Validate tool is useful before expensive API
- Can add later if validated

### Why No Vector DB?
- 100 creators x 15 posts = 1,500 posts max
- Simple keyword matching sufficient
- 24-hour cache reduces repeated fetching
- Can add later if semantic search needed

### Why Postgres Not MongoDB?
- Structured data with relationships
- JSONB for flexible config
- Free tier (500MB) sufficient
- Better TypeScript support

### Why Single-User SaaS?
- Simpler MVP (no multi-tenancy)
- Each user deploys own instance
- Full control over data
- Lower hosting costs

---

## Cost Breakdown

### Monthly Operating Costs
```
TwitterAPI.io: $5   (X data scraping)
OpenAI:        $10  (GPT-4 generation)
Neon DB:       $0   (free tier)
Langfuse:      $0   (free tier)
Vercel:        $0   (free tier)
──────────────────
Total:         $15/month
```

vs. **$29-99/month** for typical SaaS alternatives
**Savings:** $14-84/month

---

## Success Criteria

### The Learning Loop (Core Metric)
- **Week 1 Baseline:** 50% idea relevance (5/10)
- **Week 4 Target:** 80% idea relevance (8/10)
- **Success:** Measurable improvement in idea quality over time
- User perception: "Jack knows my voice" by week 4

### Time Savings (Primary)
- Baseline: 50 min/post
- Target: 20 min/post
- Success: 60% reduction achieved

### Content Quality
- 70%+ of outlines used with minor edits
- Ideas reference trending topics accurately
- User writes 100% of actual content (maintains authenticity)

---

## Specifications

For detailed documentation:
- [Main Spec](./SPEC.md) - Problem statement, goals, architecture
- [Tone Guidelines](./specs/TONE_GUIDELINES.md) - How Jack maintains your voice
- [Data Models](./specs/DATA_MODELS.md) - Complete database schema
- [Mastra Agent](./specs/MASTRA_AGENT.md) - AI functions and prompts
- [UI Design](./specs/UI_DESIGN.md) - Page layouts and components
- [User Flows](./specs/USER_FLOWS.md) - Complete user journeys

---

## Contributing

Areas where help is needed:
- Additional tone patterns
- Better topic extraction algorithms
- UI/UX improvements
- Documentation
- Bug fixes

**Process:**
1. Read [SPEC.md](./SPEC.md) and specs/
2. Open issue or discussion
3. Fork + create PR
4. Tests must pass
5. Follow existing code style

---

## License

MIT

---

## Contact

**Author:** Vishesh Baghel
**Website:** [visheshbaghel.com](https://visheshbaghel.com)
**X:** [@visheshbaghel](https://x.com/visheshbaghel)

---

## Acknowledgments

Built with:
- [Mastra](https://mastra.ai) - Agent framework
- [Next.js](https://nextjs.org) - React framework
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [TwitterAPI.io](https://twitterapi.io) - X data
- [OpenAI](https://openai.com) - GPT-4
- [Neon](https://neon.tech) - Serverless Postgres
