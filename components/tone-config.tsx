/**
 * Tone Config Component
 * Manage custom voice rules and view learned patterns
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ToneConfig {
  lowercase: boolean;
  noEmojis: boolean;
  noHashtags: boolean;
  showFailures: boolean;
  includeNumbers: boolean;
  customRules?: string[];
  learnedPatterns: {
    avgPostLength?: number;
    commonPhrases?: string[];
    showFailures?: boolean;
    includeNumbers?: boolean;
    successfulPillars?: string[];
    styleNotes?: string[];
    voiceCharacteristics?: string[];
    lastUpdated?: string;
  };
}

interface ToneConfigProps {
  userId: string;
  initialConfig?: ToneConfig;
}

export function ToneConfigComponent({ userId, initialConfig }: ToneConfigProps) {
  const [customRules, setCustomRules] = useState<string[]>(
    initialConfig?.customRules || []
  );
  const [newRule, setNewRule] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [config] = useState<ToneConfig>(initialConfig || {
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    customRules: [],
    learnedPatterns: {},
  });

  const handleAddRule = () => {
    if (newRule.trim()) {
      setCustomRules([...customRules, newRule.trim()]);
      setNewRule('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setCustomRules(customRules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/tone-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          customRules,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'failed to save custom rules');
        return;
      }

      toast.success('custom rules saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('something went wrong. please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
        {/* Custom Voice Rules */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">your voice settings</h2>
          <Card>
            <CardHeader>
              <CardTitle>custom voice rules</CardTitle>
              <CardDescription>
                define your writing style in your own words
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Example rules */}
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">examples:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>always start with a relatable problem</li>
                  <li>use storytelling format with clear beginning, middle, end</li>
                  <li>mention specific tools and technologies i use</li>
                  <li>include metrics when discussing results</li>
                  <li>show my learning journey, including mistakes</li>
                </ul>
              </div>

              {/* Add rule input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="e.g., always mention specific numbers"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                  className="flex-1"
                />
                <Button onClick={handleAddRule} size="sm" className="w-full sm:w-auto">add</Button>
              </div>

              {/* Current rules list */}
              <div className="space-y-2">
                {customRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-md group"
                  >
                    <p className="text-sm flex-1">{rule}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRule(index)}
                      className="opacity-0 group-hover:opacity-100 text-xs"
                    >
                      remove
                    </Button>
                  </div>
                ))}
              </div>

              {customRules.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  no custom rules yet. add some to personalize jack&apos;s suggestions
                </p>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'locking it in...' : 'lock it in'}
          </Button>
        </div>

        {/* Learned Patterns */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">what jack learned</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">from your bangers</CardTitle>
              <CardDescription>
                jack studies your best posts and learns your secret sauce
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.learnedPatterns.avgPostLength && (
                <div>
                  <p className="text-sm font-medium">average post length</p>
                  <p className="text-2xl font-bold">{config.learnedPatterns.avgPostLength} chars</p>
                </div>
              )}

              {config.learnedPatterns.commonPhrases && config.learnedPatterns.commonPhrases.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">common phrases</p>
                  <div className="flex flex-wrap gap-2">
                    {config.learnedPatterns.commonPhrases.map((phrase, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-muted rounded-md"
                      >
                        &quot;{phrase}&quot;
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {config.learnedPatterns.successfulPillars && config.learnedPatterns.successfulPillars.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">successful pillars</p>
                  <div className="flex flex-wrap gap-2">
                    {config.learnedPatterns.successfulPillars.map((pillar, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {config.learnedPatterns.styleNotes && config.learnedPatterns.styleNotes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">style notes</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {config.learnedPatterns.styleNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {config.learnedPatterns.voiceCharacteristics && config.learnedPatterns.voiceCharacteristics.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">voice characteristics</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {config.learnedPatterns.voiceCharacteristics.map((char, i) => (
                      <li key={i}>{char}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!config.learnedPatterns.avgPostLength &&
               (!config.learnedPatterns.commonPhrases || config.learnedPatterns.commonPhrases.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">jack is still learning</p>
                  <p className="text-xs mt-1">mark your bangers so jack can study your style</p>
                </div>
              )}

              {config.learnedPatterns.lastUpdated && (
                <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                  last updated: {new Date(config.learnedPatterns.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
