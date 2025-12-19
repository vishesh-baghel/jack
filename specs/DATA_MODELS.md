# Data Models Specification

**Purpose:** Define all database schemas and TypeScript types for Jack

---

## Database: Postgres (Neon)

**Why Postgres:**
- Structured data with relationships
- JSONB for flexible config storage
- Free tier sufficient (500MB)
- Excellent TypeScript support
- Battle-tested reliability

---

## Schema Design Principles

1. **Single-User Ready:** MVP is single-user but schema supports multi-user
2. **Caching Built-in:** TTL columns for 24-hour cache expiry
3. **Learning Data:** Track what works for continuous improvement
4. **Minimal Joins:** Denormalize where it improves performance
5. **Timestamps:** All tables have created_at, updated_at where needed

---

## Complete Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (single-user model)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  x_handle TEXT,
  passphrase TEXT, -- For owner auth - manually set in DB
  is_guest BOOLEAN DEFAULT false,
  is_owner BOOLEAN DEFAULT false, -- True for the main user (you)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Note: This is a single-user tool, not SaaS
-- Owner creates their account manually in DB with passphrase
-- Guests use read-only lurk mode

-- Tone configuration (1 per user)
CREATE TABLE tone_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic style
  style TEXT NOT NULL DEFAULT 'casual',
  
  -- Writing characteristics
  characteristics JSONB NOT NULL DEFAULT '{
    "lowercase": true,
    "emojis": false,
    "hashtags": false,
    "directTone": true,
    "technicalDepth": "moderate"
  }'::jsonb,
  
  -- Storytelling elements
  storytelling_elements JSONB NOT NULL DEFAULT '{
    "noDegree": true,
    "noBigTech": true,
    "buildInPublic": true,
    "showFailures": true,
    "shareNumbers": true
  }'::jsonb,
  
  -- Learned from "good" posts
  learned_patterns JSONB DEFAULT '{}'::jsonb,
  
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Projects context (what user is currently building)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, paused
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Creators to track
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  x_handle TEXT NOT NULL,
  name TEXT,
  follower_count INTEGER,
  category TEXT, -- startup_founder, indie_hacker, engineer, cto, influencer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, x_handle)
);

-- Trending topics (cached, 24h TTL)
CREATE TABLE trending_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mentions INTEGER DEFAULT 1,
  avg_engagement FLOAT,
  creator_handles TEXT[], -- Array of handles who mentioned
  sample_posts JSONB, -- Few example posts for context
  fetched_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  
  UNIQUE(user_id, topic, fetched_at::date) -- One entry per topic per day
);

-- Content ideas
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  rationale TEXT NOT NULL, -- Why this idea is good
  topic TEXT,
  content_pillar TEXT, -- lessons_learned, helpful_content, etc.
  trending_data JSONB, -- Related trends that inspired this
  estimated_engagement TEXT, -- high, medium, low
  suggested_format TEXT, -- post, thread, long_form
  status TEXT NOT NULL DEFAULT 'suggested', -- suggested, selected, draft_created, posted, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  selected_at TIMESTAMP,
  rejected_at TIMESTAMP
);

-- Drafts (generated content)
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
  outline_id UUID REFERENCES outlines(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- post, thread, long_form
  tweet_count INTEGER, -- For threads
  version INTEGER DEFAULT 1, -- Track revisions
  is_final BOOLEAN DEFAULT false,
  is_posted BOOLEAN DEFAULT false, -- Track if posted to X
  posted_at TIMESTAMP, -- When posted to X
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posted content (tracking + learning)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
  idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
  tweet_url TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  posted_at TIMESTAMP DEFAULT NOW(),
  
  -- Engagement metrics (fetched via Apify)
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  
  -- Learning signals
  is_marked_good BOOLEAN DEFAULT false,
  marked_good_at TIMESTAMP,
  notes TEXT, -- User notes on why it worked/didn't
  
  -- Metadata
  topics TEXT[],
  content_pillar TEXT,
  
  last_metrics_fetch TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cached creator posts (24h TTL, reduce Apify calls)
CREATE TABLE cached_creator_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_handle TEXT NOT NULL,
  tweet_id TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  posted_at TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  
  UNIQUE(user_id, tweet_id)
);

-- Performance indexes
CREATE INDEX idx_trending_topics_user_expires ON trending_topics(user_id, expires_at);
CREATE INDEX idx_cached_posts_user_expires ON cached_creator_posts(user_id, expires_at);
CREATE INDEX idx_content_ideas_user_status ON content_ideas(user_id, status, created_at DESC);
CREATE INDEX idx_posts_user_marked_good ON posts(user_id, is_marked_good, posted_at DESC);
CREATE INDEX idx_creators_user_active ON creators(user_id, is_active);
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_drafts_user_created ON drafts(user_id, created_at DESC);

-- Cleanup function for expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void AS $$
BEGIN
  DELETE FROM trending_topics WHERE expires_at < NOW();
  DELETE FROM cached_creator_posts WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## TypeScript Types

### Core Types

```typescript
// Database types (from schema)
export type User = {
  id: string;
  email: string;
  name: string | null;
  xHandle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ToneConfig = {
  id: string;
  userId: string;
  style: 'casual' | 'technical' | 'humble';
  characteristics: {
    lowercase: boolean;
    emojis: boolean;
    hashtags: boolean;
    directTone: boolean;
    technicalDepth: 'light' | 'moderate' | 'deep';
  };
  storytellingElements: {
    noDegree: boolean;
    noBigTech: boolean;
    buildInPublic: boolean;
    showFailures: boolean;
    shareNumbers: boolean;
  };
  learnedPatterns: {
    avgPostLength?: number;
    sentenceStructure?: string[];
    commonPhrases?: string[];
    avoidWords?: string[];
    successPatterns?: Array<{
      pattern: string;
      avgEngagement: number;
      examples: string[];
    }>;
  };
  updatedAt: Date;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
};

export type Creator = {
  id: string;
  userId: string;
  xHandle: string;
  name: string | null;
  followerCount: number | null;
  category: 'startup_founder' | 'indie_hacker' | 'engineer' | 'cto' | 'influencer';
  isActive: boolean;
  createdAt: Date;
};

export type TrendingTopic = {
  id: string;
  userId: string;
  topic: string;
  mentions: number;
  avgEngagement: number;
  creatorHandles: string[];
  samplePosts: Array<{
    handle: string;
    content: string;
    likes: number;
  }>;
  fetchedAt: Date;
  expiresAt: Date;
};

export type ContentIdea = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  rationale: string;
  topic: string | null;
  contentPillar: 'lessons_learned' | 'helpful_content' | 'build_progress' | 'decisions' | 'promotion';
  trendingData: {
    relatedTopics: string[];
    creatorMentions: number;
    avgEngagement: number;
  };
  estimatedEngagement: 'high' | 'medium' | 'low';
  suggestedFormat: 'post' | 'thread' | 'long_form';
  status: 'suggested' | 'selected' | 'draft_created' | 'posted' | 'rejected';
  createdAt: Date;
  selectedAt: Date | null;
  rejectedAt: Date | null;
};

export type Draft = {
  id: string;
  userId: string;
  ideaId: string | null;
  outlineId: string | null;
  content: string;
  contentType: 'post' | 'thread' | 'long_form';
  tweetCount: number | null;
  version: number;
  isFinal: boolean;
  isPosted: boolean;
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Post = {
  id: string;
  userId: string;
  draftId: string | null;
  ideaId: string | null;
  tweetUrl: string;
  content: string;
  contentType: 'post' | 'thread' | 'long_form';
  postedAt: Date;
  
  // Metrics
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  
  // Learning
  isMarkedGood: boolean;
  markedGoodAt: Date | null;
  notes: string | null;
  
  // Metadata
  topics: string[];
  contentPillar: string | null;
  
  lastMetricsFetch: Date | null;
  createdAt: Date;
};

export type CachedCreatorPost = {
  id: string;
  userId: string;
  creatorHandle: string;
  tweetId: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  postedAt: Date | null;
  fetchedAt: Date;
  expiresAt: Date;
};
```

### API Response Types

```typescript
// For frontend API calls
export type GenerateIdeasResponse = {
  ideas: ContentIdea[];
  trendingTopics: TrendingTopic[];
  generatedAt: Date;
};

export type CreateDraftResponse = {
  draft: Draft;
  idea: ContentIdea;
};

export type TrackPostResponse = {
  post: Post;
  performanceVsAvg: {
    likes: string; // e.g., "+45%"
    engagement: string;
  };
};

export type AnalyticsResponse = {
  totalPosts: number;
  avgEngagement: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
  };
  topPerformingPosts: Post[];
  contentPillarBreakdown: Record<string, number>;
  successPatterns: Array<{
    pattern: string;
    count: number;
    avgEngagement: number;
  }>;
};
```

### API Routes

```typescript
// Ideas
GET    /api/ideas              - Get all ideas for user (with status filter)
POST   /api/ideas/generate     - Generate new ideas
PATCH  /api/ideas/[id]         - Update idea status (accept/reject)

// Outlines
POST   /api/outlines/generate  - Generate outline for an idea

// Drafts
GET    /api/drafts             - Get all drafts for user
POST   /api/drafts             - Create a new draft
PATCH  /api/drafts/[id]        - Update draft content
DELETE /api/drafts/[id]        - Delete a draft
POST   /api/drafts/[id]/post   - Mark draft as posted to X

// Posts (for learning)
GET    /api/posts              - Get all posts for user
POST   /api/posts              - Create a post record from draft
PATCH  /api/posts/[id]/mark-good - Mark post as good for learning

// Creators
GET    /api/creators           - Get all tracked creators
POST   /api/creators           - Add a new creator
PATCH  /api/creators/[id]/toggle - Toggle creator active status

// Tone Config
GET    /api/tone-config        - Get user's tone configuration
PATCH  /api/tone-config        - Update tone configuration

// Auth
POST   /api/auth/signup        - Create new user
POST   /api/auth/login         - Login user
```

### Zod Schemas (for validation)

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  xHandle: z.string().regex(/^@?[\w]+$/).optional(),
  password: z.string().min(8),
});

export const updateToneConfigSchema = z.object({
  style: z.enum(['casual', 'technical', 'humble']).optional(),
  characteristics: z.object({
    lowercase: z.boolean(),
    emojis: z.boolean(),
    hashtags: z.boolean(),
    directTone: z.boolean(),
    technicalDepth: z.enum(['light', 'moderate', 'deep']),
  }).optional(),
  storytellingElements: z.object({
    noDegree: z.boolean(),
    noBigTech: z.boolean(),
    buildInPublic: z.boolean(),
    showFailures: z.boolean(),
    shareNumbers: z.boolean(),
  }).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).default('active'),
});

export const createCreatorSchema = z.object({
  xHandle: z.string().regex(/^@?[\w]+$/),
  name: z.string().optional(),
  category: z.enum(['startup_founder', 'indie_hacker', 'engineer', 'cto', 'influencer']),
});

export const trackPostSchema = z.object({
  tweetUrl: z.string().url(),
  content: z.string().min(1),
  contentType: z.enum(['post', 'thread', 'long_form']),
  ideaId: z.string().uuid().optional(),
  draftId: z.string().uuid().optional(),
});

export const markPostGoodSchema = z.object({
  postId: z.string().uuid(),
  notes: z.string().optional(),
});
```

---

## Data Flow Examples

### Example 1: Generate Ideas Flow

```
1. User opens dashboard
   ↓
2. Frontend calls GET /api/ideas
   ↓
3. Backend checks trending_topics cache
   - If valid (< 24h): Use cached
   - If expired: Call fetchTrendingTopics tool
   ↓
4. fetchTrendingTopics:
   - Fetch creators from DB
   - Check cached_creator_posts
   - If expired: Call Apify for each creator
   - Store in cached_creator_posts
   - Analyze and store in trending_topics
   ↓
5. Call generateContentIdeas tool:
   - Input: trending topics + user projects
   - Generate 5 ideas via GPT-4
   - Store in content_ideas table
   ↓
6. Return ideas to frontend
```

### Example 2: Create Draft Flow

```
1. User clicks "Create Draft" on an idea
   ↓
2. Frontend calls POST /api/drafts
   Body: { ideaId: 'uuid', contentType: 'thread' }
   ↓
3. Backend calls createDraft tool:
   - Get content_idea from DB
   - Get user tone_config
   - Get recent "good" posts for style reference
   - Generate draft via GPT-4
   - Store in drafts table
   - Update content_idea status to 'draft_created'
   ↓
4. Return draft to frontend
   ↓
5. User edits in UI, saves updates
   - Updates draft.content
   - Increments draft.version
```

### Example 3: Track Post Performance

```
1. User posts content manually on X
   ↓
2. User pastes tweet URL in Jack
   ↓
3. Frontend calls POST /api/posts/track
   Body: { tweetUrl, content, ideaId, draftId }
   ↓
4. Backend calls trackPerformance tool:
   - Extract tweet ID from URL
   - Call Apify to fetch metrics
   - Store in posts table
   - Update content_idea status to 'posted'
   ↓
5. Background job (daily):
   - For each post, re-fetch metrics
   - Update posts table
   - If post is marked_good, call analyzeTone
   ↓
6. analyzeTone updates tone_config.learned_patterns
```

---

## Migration Strategy

### Initial Setup

```typescript
// migrations/001_initial_schema.sql
// Run the complete schema above

// migrations/002_seed_user.sql
INSERT INTO users (email, name, x_handle) 
VALUES ('vishesh@example.com', 'Vishesh Baghel', '@visheshbaghel')
RETURNING *;

// Insert default tone config
INSERT INTO tone_config (user_id, style, characteristics, storytelling_elements)
SELECT 
  id,
  'casual',
  '{"lowercase": true, "emojis": false, "hashtags": false, "directTone": true, "technicalDepth": "moderate"}'::jsonb,
  '{"noDegree": true, "noBigTech": true, "buildInPublic": true, "showFailures": true, "shareNumbers": true}'::jsonb
FROM users WHERE email = 'vishesh@example.com';
```

### Backup Strategy

```typescript
// Daily backup (Prisma Postgres provides automatic backups)
// Manual backup command using direct connection:
pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d).sql

// Restore:
psql $POSTGRES_URL < backup_20251114.sql
```

---

## Performance Considerations

### Query Optimization

**Slow Query:** Get ideas with full context
```sql
-- Bad: Multiple queries
SELECT * FROM content_ideas WHERE user_id = $1;
SELECT * FROM trending_topics WHERE user_id = $1;
SELECT * FROM projects WHERE user_id = $1;

-- Good: Single query with joins
SELECT 
  ci.*,
  json_agg(DISTINCT tt.*) as trending,
  json_agg(DISTINCT p.*) as projects
FROM content_ideas ci
LEFT JOIN trending_topics tt ON tt.user_id = ci.user_id
LEFT JOIN projects p ON p.user_id = ci.user_id AND p.status = 'active'
WHERE ci.user_id = $1 AND ci.status = 'suggested'
GROUP BY ci.id
ORDER BY ci.created_at DESC;
```

### Cache Hit Rate

**Target:** 90%+ cache hit rate for trending topics

**Monitoring:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_cache,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE expires_at > NOW()) / COUNT(*), 2) as hit_rate
FROM trending_topics
WHERE user_id = $1 AND fetched_at > NOW() - INTERVAL '7 days';
```

### Storage Growth

**Estimation:**
- Ideas: ~1KB each × 5/day × 365 days = 1.8MB/year
- Drafts: ~2KB each × 5/day × 365 days = 3.6MB/year
- Posts: ~2KB each × 3/day × 365 days = 2.2MB/year
- Cached posts: ~1KB × 1500 (100 creators × 15 posts) = 1.5MB (constant)

**Total:** ~10MB/year per user (well within 500MB free tier)

---

## Data Retention Policy

### Cache (Auto-delete)
- Trending topics: 24 hours
- Cached creator posts: 24 hours

### User Content (Keep)
- Content ideas: Keep forever (learning data)
- Drafts: Keep forever (version history)
- Posts: Keep forever (performance tracking)

### Cleanup Job (Run daily)
```sql
-- Delete expired cache
DELETE FROM trending_topics WHERE expires_at < NOW();
DELETE FROM cached_creator_posts WHERE expires_at < NOW();

-- Archive old rejected ideas (optional)
UPDATE content_ideas 
SET status = 'archived' 
WHERE status = 'rejected' 
AND rejected_at < NOW() - INTERVAL '90 days';
```
