/**
 * Unit tests for Zod schemas
 * TDD: Test schemas validate correctly
 */

import { describe, it, expect } from 'vitest';
import {
  ContentPillarSchema,
  ContentFormatSchema,
  ContentIdeaSchema,
  OutlineSectionSchema,
  ContentOutlineSchema,
  TrendingTopicSchema,
  ToneConfigSchema,
  IdeaContextSchema,
  LearnedPatternsSchema,
} from '@/lib/mastra/schemas';

describe('ContentPillarSchema', () => {
  it('should accept valid content pillars', () => {
    expect(ContentPillarSchema.parse('lessons_learned')).toBe('lessons_learned');
    expect(ContentPillarSchema.parse('helpful_content')).toBe('helpful_content');
    expect(ContentPillarSchema.parse('build_progress')).toBe('build_progress');
    expect(ContentPillarSchema.parse('decisions')).toBe('decisions');
    expect(ContentPillarSchema.parse('promotion')).toBe('promotion');
  });

  it('should reject invalid content pillars', () => {
    expect(() => ContentPillarSchema.parse('invalid')).toThrow();
    expect(() => ContentPillarSchema.parse('')).toThrow();
  });
});

describe('ContentFormatSchema', () => {
  it('should accept valid formats', () => {
    expect(ContentFormatSchema.parse('post')).toBe('post');
    expect(ContentFormatSchema.parse('thread')).toBe('thread');
    expect(ContentFormatSchema.parse('long_form')).toBe('long_form');
  });

  it('should reject invalid formats', () => {
    expect(() => ContentFormatSchema.parse('article')).toThrow();
  });
});

describe('ContentIdeaSchema', () => {
  const validIdea = {
    title: 'debugging mcp servers for 6 hours',
    description: 'share the painful debugging session where console.info broke the stdio protocol and how i finally figured it out',
    rationale: 'mcp is trending with 12 mentions today, matches my recent project work, and shows authentic struggle which resonates',
    contentPillar: 'lessons_learned',
    suggestedFormat: 'thread',
    estimatedEngagement: 'high',
  };

  it('should accept valid content idea', () => {
    const result = ContentIdeaSchema.parse(validIdea);
    expect(result.title).toBe(validIdea.title);
    expect(result.contentPillar).toBe('lessons_learned');
  });

  it('should reject title over 60 characters', () => {
    const longTitle = {
      ...validIdea,
      title: 'a'.repeat(61),
    };
    expect(() => ContentIdeaSchema.parse(longTitle)).toThrow('60 characters');
  });

  it('should reject description under 50 characters', () => {
    const shortDesc = {
      ...validIdea,
      description: 'too short',
    };
    expect(() => ContentIdeaSchema.parse(shortDesc)).toThrow('at least 50');
  });

  it('should reject rationale under 50 characters', () => {
    const shortRationale = {
      ...validIdea,
      rationale: 'short',
    };
    expect(() => ContentIdeaSchema.parse(shortRationale)).toThrow('at least 50');
  });
});

describe('OutlineSectionSchema', () => {
  const validSection = {
    heading: 'Hook (attention-grabbing)',
    keyPoints: [
      'mention 6-hour debugging session',
      'tease the silly mistake',
      'create curiosity',
    ],
    toneGuidance: 'show the struggle, be honest',
    examples: ['spent 6 hours debugging my mcp server'],
  };

  it('should accept valid outline section', () => {
    const result = OutlineSectionSchema.parse(validSection);
    expect(result.heading).toBe(validSection.heading);
    expect(result.keyPoints).toHaveLength(3);
  });

  it('should reject fewer than 3 key points', () => {
    const twoPoints = {
      ...validSection,
      keyPoints: ['point 1', 'point 2'],
    };
    expect(() => OutlineSectionSchema.parse(twoPoints)).toThrow('at least 3');
  });

  it('should reject more than 5 key points', () => {
    const sixPoints = {
      ...validSection,
      keyPoints: ['1', '2', '3', '4', '5', '6'],
    };
    expect(() => OutlineSectionSchema.parse(sixPoints)).toThrow('at most 5');
  });

  it('should reject no examples', () => {
    const noExamples = {
      ...validSection,
      examples: [],
    };
    expect(() => OutlineSectionSchema.parse(noExamples)).toThrow('at least 1');
  });
});

describe('ContentOutlineSchema', () => {
  const validOutline = {
    format: 'thread',
    sections: [
      {
        heading: 'Hook',
        keyPoints: ['point 1', 'point 2', 'point 3'],
        toneGuidance: 'be casual',
        examples: ['example 1'],
      },
    ],
    estimatedLength: '5 tweets',
    toneReminders: ['lowercase', 'show failure'],
  };

  it('should accept valid outline', () => {
    const result = ContentOutlineSchema.parse(validOutline);
    expect(result.format).toBe('thread');
    expect(result.sections).toHaveLength(1);
  });

  it('should reject outline with no sections', () => {
    const noSections = {
      ...validOutline,
      sections: [],
    };
    expect(() => ContentOutlineSchema.parse(noSections)).toThrow('at least 1');
  });
});

describe('TrendingTopicSchema', () => {
  it('should accept valid trending topic', () => {
    const topic = { name: 'MCP servers', mentions: 12 };
    const result = TrendingTopicSchema.parse(topic);
    expect(result.mentions).toBe(12);
  });

  it('should reject negative mentions', () => {
    const negative = { name: 'topic', mentions: -1 };
    expect(() => TrendingTopicSchema.parse(negative)).toThrow();
  });
});

describe('ToneConfigSchema', () => {
  it('should use correct defaults', () => {
    const result = ToneConfigSchema.parse({});
    expect(result.lowercase).toBe(true);
    expect(result.noEmojis).toBe(true);
    expect(result.noHashtags).toBe(true);
    expect(result.showFailures).toBe(true);
    expect(result.includeNumbers).toBe(true);
    expect(result.learnedPatterns).toEqual({});
  });

  it('should accept custom values', () => {
    const custom = {
      lowercase: false,
      noEmojis: false,
      learnedPatterns: { avgPostLength: 180 },
    };
    const result = ToneConfigSchema.parse(custom);
    expect(result.lowercase).toBe(false);
    expect(result.learnedPatterns).toEqual({ avgPostLength: 180 });
  });
});

describe('IdeaContextSchema', () => {
  const validContext = {
    topics: [{ name: 'MCP', mentions: 12 }],
    projects: [{ name: 'Jack', description: 'X content agent', status: 'active' }],
    tone: {
      lowercase: true,
      noEmojis: true,
      noHashtags: true,
      showFailures: true,
      includeNumbers: true,
      learnedPatterns: {},
    },
    goodPosts: [],
  };

  it('should accept valid idea context', () => {
    const result = IdeaContextSchema.parse(validContext);
    expect(result.topics).toHaveLength(1);
    expect(result.projects).toHaveLength(1);
  });

  it('should accept empty good posts', () => {
    const result = IdeaContextSchema.parse(validContext);
    expect(result.goodPosts).toEqual([]);
  });
});

describe('LearnedPatternsSchema', () => {
  it('should use correct defaults', () => {
    const result = LearnedPatternsSchema.parse({});
    expect(result.commonPhrases).toEqual([]);
    expect(result.showFailures).toBe(true);
    expect(result.includeNumbers).toBe(true);
    expect(result.successfulPillars).toEqual([]);
  });

  it('should accept learned patterns from analysis', () => {
    const patterns = {
      avgPostLength: 180,
      commonPhrases: ['spent X hours', 'saved $Y'],
      showFailures: true,
      includeNumbers: true,
      successfulPillars: ['lessons_learned', 'helpful_content'],
      preferredFormat: 'thread',
    };
    const result = LearnedPatternsSchema.parse(patterns);
    expect(result.avgPostLength).toBe(180);
    expect(result.commonPhrases).toHaveLength(2);
    expect(result.preferredFormat).toBe('thread');
  });
});
