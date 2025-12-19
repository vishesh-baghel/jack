# Jack - X Content Agent

> AI agent that learns YOUR voice from YOUR successful posts, generates ideas inspired by top creators, so you write authentic content faster

**Status:** 📝 Specification Complete - Ready for Development  
**Timeline:** MVP in 4 weeks  
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
- ✅ **Learning from YOUR successful posts** (key differentiator)
- ✅ Generating ideas inspired by top creators in your space
- ✅ Creating structured outlines (YOU write the content)
- ✅ Improving idea relevance from 50% → 80% over 4 weeks
- ✅ Helping you improve writing skills (not replacing them)

**Time Savings:** 90 minutes/day = 10.5 hours/week = 42 hours/month

---

## Why Not Just Use ChatGPT?

**ChatGPT/Claude:** Generic AI that forgets context between sessions

**Jack:** Specialized X content agent with a learning loop

| Feature | ChatGPT | Claude | Jack (MVP) |
|---------|---------|--------|------------|
| Generate ideas | ✅ | ✅ | ✅ |
| Use context | ✅ (manual paste) | ✅ (manual paste) | ✅ (saved) |
| **Learn from YOUR posts** | ❌ | ❌ | **✅** |
| **Improve over time** | ❌ | ❌ | **✅** |
| **Inspired by top creators** | ❌ | ❌ | **✅** |
| **Specialized for X** | ❌ | ❌ | **✅** |

**The Learning Loop:**
1. Week 1: Generate ideas, mark 3 posts as "good"
2. Week 2: Jack analyzes patterns, future ideas match your style
3. Week 4: Idea relevance improves from 50% → 80%

**You can't get this with general-purpose ChatGPT.**

---

## Key Features (MVP)

### 1. Content Discovery
- Tracks 100 creators you specify
- Fetches trending topics daily (via Apify)
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
- **Idea relevance improves 50% → 80% over 4 weeks**
- See "Learned from X posts" indicator

### 4. Simplicity
- Clean web UI (no calendar complexity)
- Manual posting (no X API needed for MVP)
- Single-user deployment (Vercel)
- 24-hour caching (reduces costs)

---

## Tech Stack

**Frontend:** Next.js 15 + TailwindCSS + shadcn/ui  
**Backend:** Mastra agent (embedded in Next.js)  
**Database:** Postgres (Neon - free tier)  
**External APIs:**  
- Apify ($5/month for X data scraping)
- OpenAI GPT-4 (~$10/month for generation)
- Langfuse (free - LLM observability)

**Deployment:**  
- Single deployment: Vercel (free tier)

**Total Cost:** $15/month

---

## Project Structure

```
jack-x-agent/
├── SPEC.md                     # Main specification
├── specs/
│   ├── TONE_GUIDELINES.md      # How Jack writes like you
│   ├── DATA_MODELS.md          # Database schema + types
│   ├── MASTRA_AGENT.md         # Agent tools + prompts
│   ├── UI_DESIGN.md            # Page layouts + components
│   └── USER_FLOWS.md           # Complete user journeys
├── src/
│   ├── app/                    # Next.js app (to be built)
│   ├── mastra/                 # Mastra agent (to be built)
│   ├── lib/                    # Shared utilities
│   └── components/             # React components
└── README.md                   # This file
```

---

## Specifications

### 📋 [Main Spec](./SPEC.md)
Problem statement, goals, architecture, timeline, cost analysis

### 🎨 [Tone Guidelines](./specs/TONE_GUIDELINES.md)
How Jack maintains your authentic voice:
- Lowercase (except proper nouns)
- No emojis, no hashtags
- Show failures + real numbers
- Casual, honest, direct

### 🗄️ [Data Models](./specs/DATA_MODELS.md)
Complete database schema:
- Users, creators, projects
- Content ideas, drafts, posts
- Trending topics cache (24h TTL)
- Performance metrics

### 🤖 [Mastra Agent](./specs/MASTRA_AGENT.md)
2 AI functions:
1. `generateIdeas(context)` - Create 5 ideas from trends + projects + learned tone
2. `generateOutline(ideaId)` - Generate structured outline

3 deterministic functions:
1. `fetchTrendingTopics` - Analyze creators (Apify + cache)
2. `analyzeTone` - Learn from good posts (pattern extraction)
3. `trackPerformance` - V2 feature, not in MVP

### 🎯 [UI Design](./specs/UI_DESIGN.md)
Page layouts + components:
- Ideas Dashboard (main page with learning indicator)
- Outline Viewer (structured guidance)
- My Drafts (mark as good)
- Settings (tone, projects, creators)

### 🔄 [User Flows](./specs/USER_FLOWS.md)
Key flows:
- Daily content creation (primary)
- The learning loop (mark as good → analyze → improve)
- Weekly context update
- First-time setup

---

## Quick Start (After Development)

### Prerequisites
- Node.js 20+
- Postgres database (Neon free tier)
- Apify API token
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
# Add: APIFY_API_TOKEN, OPENAI_API_KEY, PRISMA_DATABASE_URL, POSTGRES_URL

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
7. Select idea → Get outline → Write content → Post on X → Track!

---

## Development Roadmap

### Week 1: Foundation (Nov 14-20)
- [x] Spec complete
- [ ] Project setup (Next.js + Mastra)
- [ ] Database schema created
- [ ] Basic auth
- [ ] Initial UI shell

### Week 2: Core Features (Nov 21-27)
- [ ] Apify integration
- [ ] Outline generation function (TDD)
- [ ] Tone validation evals
- [ ] Outline viewer UI

### Week 3: Content Generation (Nov 28 - Dec 4)
- [ ] Writing area + save drafts
- [ ] Copy outline to clipboard
- [ ] Tone configuration
- [ ] Draft save/edit

### Week 4: Learning Loop & Polish (Dec 5-11)
- [ ] Mark as "good" feature (one-click from drafts list)
- [ ] analyzeTone function (pattern extraction)
- [ ] Learning indicators UI ("learned from X posts")
- [ ] Show learned patterns in tone config
- [ ] Testing + bug fixes

### Week 5: Launch (Dec 12-18)
- [ ] Deploy to production
- [ ] Documentation
- [ ] First use in production
- [ ] Share on X

---

## Design Decisions

### Why No X API?
- X API costs $100/month (Basic tier)
- Manual posting is fine for MVP
- Validate tool is useful before expensive API
- Can add later if validated

### Why No Vector DB?
- 100 creators × 15 posts = 1,500 posts max
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

## Open Source

Jack will be open-sourced after MVP validation. Others can:
- Deploy their own instance
- Customize tone for their voice
- Track their own creators
- Adapt for their use case

**License:** MIT (pending)

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

### Reliability
- Idea generation: <10s
- Outline creation: <15s
- 99% uptime

### Pattern Recognition
- Jack learns 5+ patterns per 5 good posts
- Learned patterns visible in tone config
- Fewer outline edits needed over time

---

## Cost Breakdown

### Monthly Operating Costs
```
Apify:         $5   (X data scraping)
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

## FAQ

**Q: Why build this vs using existing tools?**  
A: Existing tools generate generic AI content. Jack provides ideas and structure while YOU write, maintaining authenticity and improving your skills. Plus, it's a learning project to share with others.

**Q: Can I use this for my own content?**  
A: Yes! After open-source release, deploy your own instance and customize.

**Q: What if I run out of Apify credits?**  
A: $5/month covers 50k results = 100 creators × 30 days × 15 posts = 45k. If you need more, upgrade to $20/month.

**Q: Will this work for LinkedIn/threads too?**  
A: Not in MVP, but architecture supports it. Could add later.

**Q: Do I need to know how to code?**  
A: For MVP deployment, yes (basic Node.js + Next.js setup). Post-launch, we'll add one-click deploy.

**Q: Why not just use AI to write everything?**  
A: Writing yourself improves articulation skills. AI provides direction (ideas, structure), but authentic voice comes from you.

---

## Contributing (Post-Launch)

We welcome contributions! Areas where help is needed:
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

## Contact & Support

**Author:** Vishesh Baghel
**Website:** [visheshbaghel.com](https://visheshbaghel.com)  
**X:** [@visheshbaghel](https://x.com/visheshbaghell)  
**Email:** Contact via website

**Support:**
- GitHub Issues (after open source)
- Documentation (in specs/)
- X threads (building in public)

---

## License

MIT (pending - will be added at open source release) 

---

## Acknowledgments

Built with:
- [Mastra](https://mastra.ai) - Agent framework
- [Next.js](https://nextjs.org) - React framework
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [Apify](https://apify.com) - X data scraping
- [OpenAI](https://openai.com) - GPT-4
- [Neon](https://neon.tech) - Serverless Postgres

---

**Built in public. Shared with the community. Learn, build, ship.** 🚀
