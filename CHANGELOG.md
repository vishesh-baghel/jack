# Jack MVP Specification Changelog

## Nov 15, 2025 - Architecture Revision + Core Value Clarification

### Major Changes

#### 1. **Deployment Architecture**
- **Before:** Separate deployments (Next.js UI on Vercel + Mastra Agent on Mastra Cloud)
- **After:** Single Next.js deployment on Vercel with embedded Mastra agent
- **Rationale:** Simpler deployment, easier for open source users, single codebase

#### 2. **Agent Scope**
- **Before:** 5 tools with agent orchestration (fetchTrendingTopics, generateContentIdeas, createDraft, analyzeTone, trackPerformance)
- **After:** 2 AI functions only (generateIdeas, generateOutline)
- **Rationale:** Maximize predictability, separate deterministic logic from AI, easier to test

#### 3. **Content Generation Philosophy**
- **Before:** Agent generates full drafts/posts
- **After:** Agent generates ideas + structured outlines, user writes content
- **Rationale:** Maintain authenticity, improve writing skills, not delegate to AI

#### 4. **Deterministic Operations (Moved to API Routes)**
- `fetchTrendingTopics` → `/api/topics` (Apify + caching)
- `trackPerformance` → `/api/posts/track` (Apify + DB)
- `analyzeTone` → `/api/tone/analyze` (SQL pattern extraction)

#### 5. **Personal Story Correction**
- **Before:** "no degree, no big tech"
- **After:** "CS degree from non-prestigious university (not IIT), no big tech"
- **Rationale:** Accurate representation

#### 6. **Development Approach**
- **Added:** Test-Driven Development (TDD) for all features
- **Added:** Mastra Evals for runtime quality checks
- **Added:** Langfuse for LLM observability

#### 7. **Core Value Clarification (Critical)**
- **Problem Identified:** "Why would anyone use Jack vs ChatGPT?"
- **Answer:** The learning loop
- **Before:** Generic "generate ideas + outlines"
- **After:** "Specialized X agent that LEARNS from YOUR successful posts"
- **Differentiator:** Ideas improve 50% → 80% over 4 weeks (measurable)
- **ChatGPT Can't Do This:** Forgets context, generic suggestions

#### 8. **MVP Scope Adjustment**
- **Removed from MVP:** Performance tracking, auto-fetch metrics, analytics dashboard
- **Kept in MVP:** Creator tracking, trending topics, learning loop
- **Rationale:** Focus on core differentiator (learning), defer analytics to V2

### Time Savings Updated

- **Before:** 35 min → 10 min per post (70% reduction)
- **After:** 50 min → 20 min per post (60% reduction)
- **Rationale:** More accurate baseline (includes brainstorming), user writes content

### Files Updated

1. **SPEC.md**
   - Restored user stories with learning loop focus
   - Updated architecture diagram (single Next.js deployment)
   - Clarified AI vs deterministic functions
   - Removed performance tracking from MVP
   - Added "learned from X posts" to success criteria
   - Updated goals & non-goals

2. **MASTRA_AGENT.md**
   - Complete rewrite
   - Removed 5 tools → 2 AI functions
   - Added implementation examples with code
   - Added Zod schemas for validation
   - Added eval definitions
   - Added TDD test examples
   - Added Langfuse observability setup
   - Removed trackPerformance (V2)

3. **TONE_GUIDELINES.md**
   - Updated narrative from "no degree" to "CS degree from non-prestigious university"
   - Updated examples to reflect accurate story

4. **README.md**
   - Added "Why Not Just Use ChatGPT?" section with comparison table
   - Updated description (learning loop emphasized)
   - Updated tech stack (single deployment)
   - Updated time savings (50min → 20min)
   - Updated features (learning loop as #3)
   - Updated success criteria (learning metrics)
   - Updated FAQ
   - Updated author bio

5. **UI_DESIGN.md**
   - Updated Page 1: Added "learned from X posts" indicator
   - Changed "Create Draft" button to "Get Outline"
   - Updated Page 2: Draft Editor → Outline Viewer (shows structured outline + writing area)
   - Removed Page 4: Track Post (moved to V2)
   - Added Page 4: My Drafts (mark as good UI)
   - Removed Page 5: Analytics (moved to V2)
   - Updated component examples

6. **USER_FLOWS.md**
   - Updated Flow 1: "Create Draft" → "Get Outline" + write content
   - Emphasized Flow 3: Mark as Good (the learning loop - core differentiator)
   - Removed performance tracking from primary flow
   - Updated Flow 4: Regenerate Draft → Regenerate Outline
   - Updated Flow 8: Batch drafts → Batch outlines
   - Marked Flow 9: Analytics as V2 (not MVP)
   - Updated success metrics to focus on learning
   - Added summary emphasizing core value

7. **DATA_MODELS.md**
   - No changes needed (schema already supports learning loop)

8. **CHANGELOG.md**
   - This file - documents all changes

### Architecture Benefits

**Predictability:**
- Explicit control flow in API routes
- No agent deciding which tools to call
- Deterministic → AI → Deterministic pattern

**Testability:**
- Simple functions to unit test
- Clear inputs/outputs
- Evals validate quality at runtime

**Observability:**
- Langfuse tracks all LLM calls
- Easy to debug (no black box orchestration)
- Performance metrics clear

**Deployment:**
- One-click Vercel deploy
- No separate agent configuration
- Easier for open source community

### Cost Impact

**No change:** Still $15/month
- Apify: $5
- OpenAI: $10
- Neon: Free
- Langfuse: Free
- Vercel: Free

### Next Steps

1. **Spec review complete** ✅
2. **Architecture validated** ✅
3. **Ready for development** ✅

### Open Questions Resolved

- ✅ Separate agent deployment? → No, embed in Next.js
- ✅ Full drafts or outlines? → Outlines, user writes
- ✅ Tool orchestration? → No, explicit API routes
- ✅ TDD approach? → Yes, all features
- ✅ Observability? → Langfuse

---

## Principles Established

1. **Simplicity over complexity** - Don't introduce tools/services unless necessary
2. **Predictability over cleverness** - Explicit flows over agent orchestration
3. **Authenticity over automation** - Help user write, don't replace them
4. **Test before implement** - TDD for reliability
5. **Single deployment** - Easier to use, share, maintain
