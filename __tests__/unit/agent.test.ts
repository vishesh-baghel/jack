/**
 * Unit tests for Mastra Agent
 * Following best practices:
 * - Mock external dependencies (OpenAI, Langfuse, DB)
 * - Test agent configuration
 * - Test context building logic
 * - Test error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
vi.mock('@/lib/db/client');
vi.mock('@/lib/observability/langfuse', () => ({
  createIdeaTrace: vi.fn(() => ({
    span: vi.fn(() => ({
      end: vi.fn(),
    })),
    update: vi.fn(),
    finalize: vi.fn(),
  })),
  createOutlineTrace: vi.fn(() => ({
    span: vi.fn(() => ({
      end: vi.fn(),
    })),
    update: vi.fn(),
    finalize: vi.fn(),
  })),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({
    modelId: 'gpt-4o',
    provider: 'openai',
  })),
}));

describe('Jack Agent Configuration', () => {
  it('should export configured agent', async () => {
    const { jackAgent } = await import('@/lib/mastra/agent');
    
    expect(jackAgent).toBeDefined();
    expect(jackAgent.name).toBe('jack');
  });

  it('should have generateIdeas function', async () => {
    const { jackAgent } = await import('@/lib/mastra/agent');
    
    expect(jackAgent.generate).toBeDefined();
    expect(typeof jackAgent.generate).toBe('function');
  });
});

describe('Context Building', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildIdeaContext', () => {
    it('should build context with user data', async () => {
      const { buildIdeaContext } = await import('@/lib/mastra/context');
      
      const mockUser = {
        id: 'u1',
        projects: [{ name: 'Jack', description: 'X agent', status: 'active' }],
        creators: [{ xHandle: '@creator1', isActive: true }],
        toneConfig: {
          lowercase: true,
          noEmojis: true,
          noHashtags: true,
          showFailures: true,
          includeNumbers: true,
          learnedPatterns: {},
        },
      };

      const context = await buildIdeaContext(mockUser, []);

      expect(context.projects).toHaveLength(1);
      expect(context.tone.lowercase).toBe(true);
      expect(context.goodPosts).toEqual([]);
    });

    it('should include trending topics if provided', async () => {
      const { buildIdeaContext } = await import('@/lib/mastra/context');
      
      const mockUser = {
        id: 'u1',
        projects: [],
        creators: [],
        toneConfig: {
          lowercase: true,
          noEmojis: true,
          noHashtags: true,
          showFailures: true,
          includeNumbers: true,
          learnedPatterns: {},
        },
      };

      const topics = [
        { name: 'MCP', mentions: 150 },
        { name: 'AI Agents', mentions: 120 },
      ];

      const context = await buildIdeaContext(mockUser, topics);

      expect(context.topics).toHaveLength(2);
      expect(context.topics[0].name).toBe('MCP');
    });
  });

  describe('buildOutlineContext', () => {
    it('should build context with idea and user data', async () => {
      const { buildOutlineContext } = await import('@/lib/mastra/context');
      
      const mockIdea = {
        title: 'Test Idea',
        description: 'Test description',
        contentPillar: 'engineering',
        suggestedFormat: 'thread',
      };

      const mockUser = {
        id: 'u1',
        toneConfig: {
          lowercase: true,
          noEmojis: true,
          noHashtags: true,
          showFailures: true,
          includeNumbers: true,
          learnedPatterns: {
            avgPostLength: 180,
            commonPhrases: ['spent X hours'],
          },
        },
      };

      const context = await buildOutlineContext(mockIdea, mockUser, []);

      expect(context.idea).toEqual(mockIdea);
      expect(context.tone.lowercase).toBe(true);
      expect(context.tone.learnedPatterns.avgPostLength).toBe(180);
    });
  });
});

describe('System Prompts', () => {
  it('should have idea generation prompt', async () => {
    const { IDEA_GENERATION_PROMPT } = await import('@/lib/mastra/prompts');
    
    expect(IDEA_GENERATION_PROMPT).toBeDefined();
    expect(typeof IDEA_GENERATION_PROMPT).toBe('string');
    expect(IDEA_GENERATION_PROMPT).toContain('content ideas');
  });

  it('should have outline generation prompt', async () => {
    const { OUTLINE_GENERATION_PROMPT } = await import('@/lib/mastra/prompts');
    
    expect(OUTLINE_GENERATION_PROMPT).toBeDefined();
    expect(typeof OUTLINE_GENERATION_PROMPT).toBe('string');
    expect(OUTLINE_GENERATION_PROMPT).toContain('outline');
  });

  it('should have system prompt with tone guidelines', async () => {
    const { JACK_SYSTEM_PROMPT } = await import('@/lib/mastra/prompts');
    
    expect(JACK_SYSTEM_PROMPT).toBeDefined();
    expect(JACK_SYSTEM_PROMPT).toContain('lowercase');
    expect(JACK_SYSTEM_PROMPT).toContain('no emojis');
    expect(JACK_SYSTEM_PROMPT).toContain('authentic');
  });
});
