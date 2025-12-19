/**
 * Tone Config Component
 * Manage tone preferences and view learned patterns
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ToneConfig {
  lowercase: boolean;
  noEmojis: boolean;
  noHashtags: boolean;
  showFailures: boolean;
  includeNumbers: boolean;
  learnedPatterns: {
    avgPostLength?: number;
    commonPhrases?: string[];
    showFailures?: boolean;
    includeNumbers?: boolean;
    successfulPillars?: string[];
  };
}

interface ToneConfigProps {
  userId: string;
  initialConfig?: ToneConfig;
}

export function ToneConfigComponent({ userId, initialConfig }: ToneConfigProps) {
  const [config, setConfig] = useState<ToneConfig>(initialConfig || {
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    learnedPatterns: {},
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof Omit<ToneConfig, 'learnedPatterns'>) => {
    setConfig({ ...config, [key]: !config[key] });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/tone-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences: {
            lowercase: config.lowercase,
            noEmojis: config.noEmojis,
            noHashtags: config.noHashtags,
            showFailures: config.showFailures,
            includeNumbers: config.includeNumbers,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save config');
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOptions: Array<{
    key: keyof Omit<ToneConfig, 'learnedPatterns'>;
    label: string;
    description: string;
  }> = [
    {
      key: 'lowercase',
      label: 'lowercase only',
      description: 'use lowercase for everything except proper nouns',
    },
    {
      key: 'noEmojis',
      label: 'no emojis',
      description: 'keep content clean and professional',
    },
    {
      key: 'noHashtags',
      label: 'no hashtags',
      description: 'avoid using #tags in content',
    },
    {
      key: 'showFailures',
      label: 'show failures',
      description: 'be honest about struggles and learning process',
    },
    {
      key: 'includeNumbers',
      label: 'include numbers',
      description: 'use specific metrics and data points',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">settings</h1>
        <p className="text-muted-foreground">
          see how i&apos;ve configured my writing style and voice
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preferences */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">your voice settings</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {toggleOptions.map(({ key, label, description }) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor={key} className="text-base cursor-pointer">
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  </div>
                  <button
                    id={key}
                    onClick={() => handleToggle(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      config[key] ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                        config[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'locking it in...' : 'lock it in'}
          </Button>
        </div>

        {/* Learned Patterns */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">what jack learned</h2>
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

              {!config.learnedPatterns.avgPostLength && 
               (!config.learnedPatterns.commonPhrases || config.learnedPatterns.commonPhrases.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">jack is still learning</p>
                  <p className="text-xs mt-1">mark your bangers so jack can study your style</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
