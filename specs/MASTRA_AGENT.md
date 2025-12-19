# Mastra Agent Specification

**Purpose:** Define Jack's embedded AI agent for idea and outline generation

---

## Architecture Overview

Jack uses Mastra **embedded in Next.js** (not deployed separately). The agent provides:
- **generateIdeas(context)** - Create 5 content ideas
- **generateOutline(ideaId)** - Generate structured outline
- **Memory** - Track user preferences and context
- **Evals** - Validate tone and quality

**Key Principle:** Agent does NOT do tool orchestration. It receives context and generates structured output.

---

## Agent Definition

```typescript
// src/mastra/agent.ts
import { Agent } from '@mastra/core';
import { openai } from '@mastra/core/ai';
import { memory } from './memory';

export const jackAgent = new Agent({
  name: 'jack',
  instructions: JACK_SYSTEM_PROMPT,
  model: openai('gpt-4'),
  memory, // Mastra memory for context
});
```

---

## System Prompt

```
You are Jack, X content assistant for Vishesh Baghel.

YOUR ROLE:
- Generate content IDEAS (not full posts)
- Provide structured OUTLINES (user writes content)
- Match Vishesh's authentic tone

TONE (NEVER DEVIATE):
- lowercase (except TypeScript, @mastra, etc.)
- NO emojis, NO hashtags
- casual, honest, direct
- show failures + real numbers
- business value over jargon

STORYTELLING:
- cs degree from non-prestigious university, building anyway
- no big tech experience, learning by shipping
- share messy middle (bugs, mistakes)
- real metrics (time, money, results)

CONTENT PILLARS:
1. Lessons Learned (35%)
2. Helpful Tips (25%)
3. Build Progress (15%)
4. Decisions (10%)
5. Promotion (15%)

VALIDATION CHECKLIST:
✓ lowercase? ✓ no emojis? ✓ no hashtags?
✓ real numbers? ✓ shows struggle? ✓ sounds human?
```

Full prompt in [TONE_GUIDELINES.md](./TONE_GUIDELINES.md)

---

## AI Functions

### 1. generateIdeas(context)

**Purpose:** Generate 5 content ideas based on trending topics, projects, and tone

**Implementation:**
```typescript
// src/mastra/ideas.ts
import { jackAgent } from './agent';
import { ContentIdeasSchema } from './schemas';

export async function generateIdeas(context: IdeaContext) {
  const prompt = buildIdeaPrompt(context);
  
  const response = await jackAgent.generate(prompt, {
    format: 'json',
    schema: ContentIdeasSchema, // Zod schema
  });
  
  return response;
}
```

**Prompt Template:**
```typescript
function buildIdeaPrompt(context: IdeaContext): string {
  return `
Generate 5 content ideas for X (Twitter) based on this context:

TRENDING TOPICS (mentioned by creators you track):
${context.topics.map(t => `- ${t.name} (${t.mentions} mentions)`).join('\n')}

YOUR CURRENT PROJECTS:
${context.projects.map(p => `- ${p.name}: ${p.description}`).join('\n')}

YOUR RECENT SUCCESSFUL POSTS (marked as good):
${context.goodPosts.map(p => `- ${p.content} (${p.engagement} engagement)`).join('\n')}

YOUR TONE CONFIG:
- Lowercase: ${context.tone.lowercase}
- Show failures: ${context.tone.show_failures}
- Include numbers: ${context.tone.include_numbers}

CONTENT PILLAR DISTRIBUTION:
- 2 Lessons Learned (from recent project work)
- 1 Helpful Content (tutorial, tip, tool)
- 1 Build Progress (what you're building now)
- 1 Decision/Promotion (tradeoff or subtle self-promo)

For each idea, provide:
1. title (lowercase, <60 chars)
2. description (2-3 sentences explaining the idea)
3. rationale (why this will work: trending? project-related? matches successful pattern?)
4. contentPillar (lessons_learned|helpful_content|build_progress|decisions|promotion)
5. suggestedFormat (post|thread|long_form)
6. estimatedEngagement (low|medium|high based on similar past posts)

Return as JSON array of 5 ideas.
`;
}
```

**Zod Schema:**
```typescript
// src/mastra/schemas.ts
import { z } from 'zod';

export const ContentIdeaSchema = z.object({
  title: z.string().max(60),
  description: z.string().min(50),
  rationale: z.string().min(50),
  contentPillar: z.enum([
    'lessons_learned',
    'helpful_content', 
    'build_progress',
    'decisions',
    'promotion'
  ]),
  suggestedFormat: z.enum(['post', 'thread', 'long_form']),
  estimatedEngagement: z.enum(['low', 'medium', 'high']),
});

export const ContentIdeasSchema = z.array(ContentIdeaSchema).length(5);
```

**Evals:**
```typescript
// src/mastra/evals.ts
import { createEval } from '@mastra/evals';

export const ideasRelevanceEval = createEval({
  name: 'ideas-relevance',
  description: 'Validates ideas match trending topics and projects',
  
  async scorer(context, ideas) {
    let score = 0;
    
    // Check if ideas mention trending topics
    const topicMentions = ideas.filter(idea => 
      context.topics.some(t => 
        idea.description.toLowerCase().includes(t.name.toLowerCase())
      )
    ).length;
    score += (topicMentions / 5) * 0.5;
    
    // Check if ideas relate to projects
    const projectRelevance = ideas.filter(idea =>
      context.projects.some(p =>
        idea.description.toLowerCase().includes(p.name.toLowerCase())
      )
    ).length;
    score += (projectRelevance / 5) * 0.5;
    
    return {
      score,
      passed: score >= 0.6,
      details: { topicMentions, projectRelevance },
    };
  },
});
```

---

### 2. generateOutline(ideaId)

**Purpose:** Create structured outline for selected idea (user writes actual content)

**Implementation:**
```typescript
// src/mastra/outlines.ts
import { jackAgent } from './agent';
import { ContentOutlineSchema } from './schemas';

export async function generateOutline(ideaId: string) {
  const idea = await db.contentIdeas.findUnique({ where: { id: ideaId } });
  const context = await getOutlineContext(idea.userId);
  
  const prompt = buildOutlinePrompt(idea, context);
  
  const response = await jackAgent.generate(prompt, {
    format: 'json',
    schema: ContentOutlineSchema,
  });
  
  return response;
}
```

**Prompt Template:**
```typescript
function buildOutlinePrompt(idea: ContentIdea, context: OutlineContext): string {
  return `
Create a structured outline for this content idea:

IDEA:
Title: ${idea.title}
Description: ${idea.description}
Format: ${idea.suggestedFormat}
Pillar: ${idea.contentPillar}

CONTEXT:
Projects: ${context.projects.map(p => p.name).join(', ')}
Recent good posts: ${context.goodPosts.length}
Tone: lowercase, honest, show failures

${idea.suggestedFormat === 'thread' ? `
THREAD STRUCTURE (5-8 tweets):
1. Hook (attention-grabbing, lowercase)
2. Problem/Context (what struggle led here)
3. Attempt 1 (what you tried, failed)
4. Attempt 2 (what worked, with numbers)
5. Key Insight (lesson learned)
6. Implementation (if technical, brief code/config)
7. Results (metrics: time saved, cost, performance)
8. CTA (subtle: repo link, question, or tip)
` : `
POST STRUCTURE (single tweet):
1. Hook (first 40 chars)
2. Core message (problem → solution)
3. Metric/outcome (quantified result)
`}

For each section, provide:
- heading (what this section covers)
- keyPoints (3-5 bullet points of what to include)
- toneGuidance (specific reminders: "show the 6-hour debug session", "mention tier-3 college")
- examples (1-2 sentence fragments in the right tone)

IMPORTANT:
- This is an OUTLINE, not full content
- User will write actual posts
- Keep it structured but flexible
- Emphasize authenticity over polish

Return as JSON with sections array.
`;
}
```

**Zod Schema:**
```typescript
export const OutlineSectionSchema = z.object({
  heading: z.string(),
  keyPoints: z.array(z.string()).min(3).max(5),
  toneGuidance: z.string(),
  examples: z.array(z.string()).min(1).max(2),
});

export const ContentOutlineSchema = z.object({
  format: z.enum(['post', 'thread', 'long_form']),
  sections: z.array(OutlineSectionSchema),
  estimatedLength: z.string(), // "280 chars" or "5 tweets"
  toneReminders: z.array(z.string()), // ["lowercase", "show failure", "include metrics"]
});
```

**Evals:**
```typescript
export const outlineToneEval = createEval({
  name: 'outline-tone-check',
  description: 'Validates outline examples match tone guidelines',
  
  async scorer(input, outline) {
    const checks = {
      lowercase: outline.sections.every(s =>
        s.examples.every(ex => /^[a-z]/.test(ex))
      ),
      noEmojis: outline.sections.every(s =>
        s.examples.every(ex => !hasEmojis(ex))
      ),
      showsStruggle: outline.sections.some(s =>
        s.keyPoints.some(kp => 
          /debug|fail|stuck|broke|took \d+ hours/.test(kp.toLowerCase())
        )
      ),
    };
    
    const score = Object.values(checks).filter(Boolean).length / 3;
    
    return {
      score,
      passed: score >= 0.66,
      details: checks,
    };
  },
});
```

---

## Memory Configuration

**Mastra Memory stores:**
- User tone preferences
- Successful content patterns
- Recent projects context
- Creator tracking preferences

```typescript
// src/mastra/memory.ts
import { Memory } from '@mastra/memory';
import { db } from '@/lib/db';

export const memory = new Memory({
  storage: db, // Uses Postgres via Prisma
  
  async retrieve(userId: string) {
    const tone = await db.toneConfig.findUnique({ where: { userId } });
    const projects = await db.projects.findMany({ 
      where: { userId, status: 'active' } 
    });
    const goodPosts = await db.posts.findMany({
      where: { userId, isMarkedGood: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    
    return { tone, projects, goodPosts };
  },
});
```

---

## API Route Integration

**How it's called from Next.js:**

```typescript
// src/app/api/agent/route.ts
import { generateIdeas, generateOutline } from '@/mastra';

export async function POST(req: Request) {
  const { action, data } = await req.json();
  const userId = await getUserId(req);
  
  if (action === 'ideas') {
    // 1. Get context (deterministic)
    const topics = await getTrendingTopics(userId);
    const projects = await getActiveProjects(userId);
    const tone = await getToneConfig(userId);
    const goodPosts = await getGoodPosts(userId);
    
    const context = { topics, projects, tone, goodPosts };
    
    // 2. Call AI agent (non-deterministic)
    const ideas = await generateIdeas(context);
    
    // 3. Store ideas (deterministic)
    await storeIdeas(userId, ideas);
    
    return Response.json({ ideas });
  }
  
  if (action === 'outline') {
    // 1. Get idea (deterministic)
    const idea = await getIdea(data.ideaId);
    
    // 2. Call AI agent (non-deterministic)
    const outline = await generateOutline(data.ideaId);
    
    // 3. Store outline (deterministic)
    await storeOutline(userId, data.ideaId, outline);
    
    return Response.json({ outline });
  }
  
  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
```

---

## Testing Strategy (TDD)

### Unit Tests

```typescript
// src/tests/agent.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { generateIdeas, generateOutline } from '@/mastra';

describe('generateIdeas', () => {
  const mockContext = {
    topics: [
      { name: 'MCP servers', mentions: 12 },
      { name: 'Postgres optimization', mentions: 8 },
    ],
    projects: [
      { name: 'Jack', description: 'X content agent' },
    ],
    tone: { lowercase: true, show_failures: true },
    goodPosts: [],
  };
  
  it('generates exactly 5 ideas', async () => {
    const ideas = await generateIdeas(mockContext);
    expect(ideas).toHaveLength(5);
  });
  
  it('respects content pillar distribution', async () => {
    const ideas = await generateIdeas(mockContext);
    const pillars = ideas.map(i => i.contentPillar);
    
    const lessonCount = pillars.filter(p => p === 'lessons_learned').length;
    expect(lessonCount).toBe(2);
  });
  
  it('passes relevance eval', async () => {
    const ideas = await generateIdeas(mockContext);
    const eval = await ideasRelevanceEval.run(mockContext, ideas);
    
    expect(eval.passed).toBe(true);
    expect(eval.score).toBeGreaterThan(0.6);
  });
});

describe('generateOutline', () => {
  it('creates structured outline for thread', async () => {
    const outline = await generateOutline(mockIdeaId);
    
    expect(outline.format).toBe('thread');
    expect(outline.sections.length).toBeGreaterThanOrEqual(5);
    expect(outline.sections.length).toBeLessThanOrEqual(8);
  });
  
  it('passes tone eval', async () => {
    const outline = await generateOutline(mockIdeaId);
    const eval = await outlineToneEval.run({}, outline);
    
    expect(eval.passed).toBe(true);
    expect(eval.details.lowercase).toBe(true);
    expect(eval.details.noEmojis).toBe(true);
  });
});
```

### Integration Tests

```typescript
// src/tests/integration/agent-flow.test.ts
import { describe, it, expect } from 'vitest';

describe('Full idea → outline flow', () => {
  it('generates ideas and creates outline', async () => {
    // 1. Generate ideas
    const response1 = await fetch('/api/agent', {
      method: 'POST',
      body: JSON.stringify({ action: 'ideas' }),
    });
    const { ideas } = await response1.json();
    
    expect(ideas).toHaveLength(5);
    
    // 2. Select first idea, generate outline
    const response2 = await fetch('/api/agent', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'outline',
        data: { ideaId: ideas[0].id }
      }),
    });
    const { outline } = await response2.json();
    
    expect(outline.sections.length).toBeGreaterThan(0);
  });
});
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| generateIdeas | <8s | GPT-4 API call |
| generateOutline | <10s | GPT-4 API call |
| Memory retrieval | <500ms | Postgres queries |
| Eval execution | <1s | Local validation |

---

## Error Handling

**OpenAI Failures:**
```typescript
async function generateIdeasWithRetry(context: IdeaContext) {
  const maxRetries = 2;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateIdeas(context);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(1000 * (attempt + 1)); // Exponential backoff
    }
  }
}
```

**Validation Failures:**
```typescript
// If eval fails, regenerate with stricter prompt
if (!toneEval.passed) {
  return await jackAgent.generate(prompt, {
    format: 'json',
    schema: ContentOutlineSchema,
    temperature: 0.3, // Lower temperature for stricter adherence
  });
}
```

---

## Observability (Langfuse)

**Setup:**
```typescript
// lib/observability/langfuse.ts
import { Langfuse } from 'langfuse';

export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
});

// Create trace for idea generation
export function createIdeaGenerationTrace(userId: string) {
  return langfuse.trace({
    name: 'generate-ideas',
    userId,
    metadata: {
      component: 'mastra-agent',
      function: 'generateIdeas',
    },
  });
}
```

**Tracked Metrics:**
- Latency per generation
- Token usage (input/output)
- Cost per operation
- Success/failure rates
- Eval pass rates

---

## Summary

**Architecture:**
- Mastra agent embedded in Next.js (single deployment)
- Only 2 AI functions: generateIdeas(), generateOutline()
- All other operations are deterministic API routes
- Memory tracks user context
- Evals validate quality
- Helicone tracks observability

**Development Approach:**
- TDD: Write tests before implementation
- Unit tests for each function
- Integration tests for full flows
- Evals ensure quality at runtime

**Performance:**
- Ideas generation: <8s
- Outline generation: <10s
- Predictable, testable, observable

---

See [DATA_MODELS.md](./DATA_MODELS.md) for database schema details.
