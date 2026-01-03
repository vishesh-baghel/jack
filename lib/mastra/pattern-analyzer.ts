/**
 * Pattern Analyzer Service
 * Uses LLM to extract patterns from good posts for learning
 */

import { jackAgent } from './agent';
import type { LearnedPatterns } from './schemas';

export interface AnalyzedPatterns {
  avgPostLength?: number;
  commonPhrases?: string[];
  successfulPillars?: string[];
  styleNotes?: string[];
  voiceCharacteristics?: string[];
}

/**
 * Analyze good posts and extract patterns using LLM
 */
export async function analyzeGoodPosts(posts: Array<{
  content: string;
  contentPillar: string;
  contentType: string;
}>): Promise<AnalyzedPatterns> {
  // Need at least 3 posts for meaningful analysis
  if (posts.length < 3) {
    console.log('[PATTERN ANALYZER] Insufficient posts for pattern analysis (need at least 3)');
    return {};
  }

  try {
    const prompt = `Analyze these successful posts and extract patterns to help replicate the writing style:

Posts:
${posts.map((p, i) => `${i + 1}. [${p.contentPillar}] ${p.content}`).join('\n\n')}

Extract the following patterns:

1. **avgPostLength** (number): Calculate the average character count across all posts
2. **commonPhrases** (array of 3-5 strings): Identify frequently used phrases (3-5 words each) that appear across multiple posts
3. **successfulPillars** (array of strings): List the content pillars that appear most frequently
4. **styleNotes** (array of 2-4 strings): Observe specific style patterns (e.g., "uses short sentences", "starts with questions", "includes personal anecdotes")
5. **voiceCharacteristics** (array of 2-4 strings): Identify voice and tone patterns (e.g., "casual and conversational", "technical but accessible", "honest about failures")

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "avgPostLength": <number>,
  "commonPhrases": [<array of 3-5 strings>],
  "successfulPillars": [<array of pillar names that appear in posts>],
  "styleNotes": [<array of 2-4 style observations>],
  "voiceCharacteristics": [<array of 2-4 voice patterns>]
}`;

    const result = await jackAgent.generate(prompt);

    // Parse the result (remove markdown code blocks if present)
    let jsonText = result.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const patterns: AnalyzedPatterns = JSON.parse(jsonText);

    console.log('[PATTERN ANALYZER] Analysis complete:', {
      avgPostLength: patterns.avgPostLength,
      phrasesCount: patterns.commonPhrases?.length || 0,
      pillarsCount: patterns.successfulPillars?.length || 0,
      styleNotesCount: patterns.styleNotes?.length || 0,
      voiceCharsCount: patterns.voiceCharacteristics?.length || 0,
    });

    return patterns;
  } catch (error) {
    console.error('Error analyzing good posts:', error);
    throw new Error(
      `Pattern analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
