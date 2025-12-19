/**
 * Zod schemas for Jack's Mastra agent
 * Based on specs/MASTRA_AGENT.md
 */

import { z } from 'zod';

// Content Pillars
export const ContentPillarSchema = z.enum([
  'lessons_learned',
  'helpful_content',
  'build_progress',
  'decisions',
  'promotion',
  'side-projects',
  'engineering',
  'productivity',
  'learning',
]);

export type ContentPillar = z.infer<typeof ContentPillarSchema>;

// Content Formats
export const ContentFormatSchema = z.enum(['post', 'thread', 'long_form']);

export type ContentFormat = z.infer<typeof ContentFormatSchema>;

// Estimated Engagement
export const EstimatedEngagementSchema = z.enum(['low', 'medium', 'high']);

export type EstimatedEngagement = z.infer<typeof EstimatedEngagementSchema>;

// Single Content Idea
export const ContentIdeaSchema = z.object({
  title: z.string().max(60, 'Title must be 60 characters or less'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  rationale: z.string().min(50, 'Rationale must be at least 50 characters'),
  contentPillar: ContentPillarSchema,
  suggestedFormat: ContentFormatSchema,
  estimatedEngagement: EstimatedEngagementSchema,
});

export type ContentIdea = z.infer<typeof ContentIdeaSchema>;

// Array of 5 Content Ideas
export const ContentIdeasSchema = z
  .array(ContentIdeaSchema)
  .length(5, 'Must generate exactly 5 ideas');

export type ContentIdeas = z.infer<typeof ContentIdeasSchema>;

// Outline Section
export const OutlineSectionSchema = z.object({
  heading: z.string().min(1, 'Heading is required'),
  keyPoints: z
    .array(z.string())
    .min(1, 'Must have at least 1 key point')
    .max(10, 'Must have at most 10 key points'),
  toneGuidance: z.string(),
  examples: z
    .array(z.string())
    .min(0, 'Examples are optional')
    .max(5, 'Must have at most 5 examples')
    .optional()
    .default([]),
});

export type OutlineSection = z.infer<typeof OutlineSectionSchema>;

// Content Outline
export const ContentOutlineSchema = z.object({
  format: ContentFormatSchema.optional(),
  sections: z.array(OutlineSectionSchema).min(1, 'Must have at least 1 section'),
  estimatedLength: z.string(),
  toneReminders: z.array(z.string()),
});

export type ContentOutline = z.infer<typeof ContentOutlineSchema>;

// Trending Topic
export const TrendingTopicSchema = z.object({
  name: z.string(),
  mentions: z.number().int().nonnegative(),
});

export type TrendingTopic = z.infer<typeof TrendingTopicSchema>;

// Project
export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  status: z.enum(['active', 'paused', 'completed']).default('active'),
});

export type Project = z.infer<typeof ProjectSchema>;

// Tone Config
export const ToneConfigSchema = z.object({
  lowercase: z.boolean().default(true),
  noEmojis: z.boolean().default(true),
  noHashtags: z.boolean().default(true),
  showFailures: z.boolean().default(true),
  includeNumbers: z.boolean().default(true),
  learnedPatterns: z.record(z.unknown()).default({}),
});

export type ToneConfig = z.infer<typeof ToneConfigSchema>;

// Good Post (for learning)
export const GoodPostSchema = z.object({
  content: z.string(),
  engagement: z.number().optional(),
  contentPillar: ContentPillarSchema,
  format: ContentFormatSchema,
});

export type GoodPost = z.infer<typeof GoodPostSchema>;

// Context for Idea Generation
export const IdeaContextSchema = z.object({
  topics: z.array(TrendingTopicSchema),
  projects: z.array(ProjectSchema),
  tone: ToneConfigSchema,
  goodPosts: z.array(GoodPostSchema),
});

export type IdeaContext = z.infer<typeof IdeaContextSchema>;

// Context for Outline Generation
export const OutlineContextSchema = z.object({
  idea: ContentIdeaSchema,
  projects: z.array(ProjectSchema),
  goodPosts: z.array(GoodPostSchema),
  tone: ToneConfigSchema,
});

export type OutlineContext = z.infer<typeof OutlineContextSchema>;

// Learned Patterns (extracted from good posts)
export const LearnedPatternsSchema = z.object({
  avgPostLength: z.number().optional(),
  commonPhrases: z.array(z.string()).default([]),
  showFailures: z.boolean().default(true),
  includeNumbers: z.boolean().default(true),
  successfulPillars: z.array(ContentPillarSchema).default([]),
  preferredFormat: ContentFormatSchema.optional(),
});

export type LearnedPatterns = z.infer<typeof LearnedPatternsSchema>;
