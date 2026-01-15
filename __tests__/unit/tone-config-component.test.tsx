/**
 * Unit tests for ToneConfigComponent
 * Tests custom voice rules functionality and persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ToneConfigComponent', () => {
  const mockUserId = 'user-123';
  const mockInitialConfig = {
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    customRules: ['always start with a relatable problem', 'use storytelling format'],
    learnedPatterns: {
      avgPostLength: 280,
      commonPhrases: ['here\'s how', 'lesson learned'],
      successfulPillars: ['build_progress', 'lessons_learned'],
      styleNotes: ['conversational tone', 'uses numbers'],
      voiceCharacteristics: ['direct', 'helpful'],
      lastUpdated: '2024-01-01T00:00:00.000Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should render with initial config data', async () => {
    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    // Note: "settings" heading moved to page level, not in component anymore
    expect(screen.getByText('custom voice rules')).toBeInTheDocument();
    expect(screen.getByText('what jack learned')).toBeInTheDocument();
    expect(screen.getByText('your voice settings')).toBeInTheDocument();
  });

  it('should display initial custom rules', async () => {
    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    const rules = screen.getAllByText('always start with a relatable problem');
    // Should appear in both examples section AND in actual custom rules
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('use storytelling format').length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state when no custom rules exist', async () => {
    const configWithoutRules = {
      ...mockInitialConfig,
      customRules: [],
    };

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={configWithoutRules} />);

    expect(screen.getByText(/no custom rules yet/i)).toBeInTheDocument();
  });

  it('should add a new custom rule when user types and clicks add', async () => {
    const configWithoutRules = {
      ...mockInitialConfig,
      customRules: [],
    };

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={configWithoutRules} />);

    const input = screen.getByPlaceholderText(/e.g., always mention specific numbers/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'include metrics when discussing results' } });
    fireEvent.click(addButton);

    const addedRules = screen.getAllByText('include metrics when discussing results');
    expect(addedRules.length).toBeGreaterThanOrEqual(1);
    expect(input).toHaveValue('');
  });

  it('should add custom rule on Enter key press', async () => {
    const configWithoutRules = {
      ...mockInitialConfig,
      customRules: [],
    };

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={configWithoutRules} />);

    const input = screen.getByPlaceholderText(/e.g., always mention specific numbers/i);

    fireEvent.change(input, { target: { value: 'show my learning journey' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('show my learning journey')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('should not add empty or whitespace-only rules', async () => {
    const { ToneConfigComponent } = await import('@/components/tone-config');
    const { container } = render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    const input = screen.getByPlaceholderText(/e.g., always mention specific numbers/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    // Count rules before attempts
    const rulesContainerBefore = container.querySelectorAll('.bg-muted.rounded-md.group');
    const initialCount = rulesContainerBefore.length;

    // Try adding empty string
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(addButton);

    // Try adding whitespace
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addButton);

    // Count rules after attempts
    const rulesContainerAfter = container.querySelectorAll('.bg-muted.rounded-md.group');
    expect(rulesContainerAfter.length).toBe(initialCount);
  });

  it('should remove a custom rule when remove button is clicked', async () => {
    const { ToneConfigComponent } = await import('@/components/tone-config');
    const { container } = render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    // Count custom rules initially (in the group divs, not examples)
    const rulesContainerBefore = container.querySelectorAll('.bg-muted.rounded-md.group');
    expect(rulesContainerBefore.length).toBe(2);

    // Hover over the rule to show remove button (simulated by direct click)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    // Count custom rules after removal
    const rulesContainerAfter = container.querySelectorAll('.bg-muted.rounded-md.group');
    expect(rulesContainerAfter.length).toBe(1);
  });

  it('should save custom rules successfully and show success toast', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ config: mockInitialConfig }),
    });

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    const saveButton = screen.getByRole('button', { name: /lock it in/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/tone-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mockUserId,
          customRules: mockInitialConfig.customRules,
        }),
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('custom rules saved successfully');
    });
  });

  it('should show error toast when save fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to save config' }),
    });

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    const saveButton = screen.getByRole('button', { name: /lock it in/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save config');
    });
  });

  it('should show error toast on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    const saveButton = screen.getByRole('button', { name: /lock it in/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('something went wrong. please try again.');
    });
  });

  it('should disable save button while saving', async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ config: mockInitialConfig }),
            } as never);
          }, 100);
        })
    );

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    const saveButton = screen.getByRole('button', { name: /lock it in/i });
    fireEvent.click(saveButton);

    // Button should show loading state
    expect(screen.getByText(/locking it in.../i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/lock it in/i)).toBeInTheDocument();
    });
  });

  it('should display learned patterns when available', async () => {
    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    expect(screen.getByText('280 chars')).toBeInTheDocument();
    expect(screen.getByText(/here's how/i)).toBeInTheDocument();
    expect(screen.getByText(/lesson learned/i)).toBeInTheDocument();
    expect(screen.getByText(/conversational tone/i)).toBeInTheDocument();
  });

  it('should show learning state when no learned patterns exist', async () => {
    const configWithoutPatterns = {
      ...mockInitialConfig,
      learnedPatterns: {},
    };

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={configWithoutPatterns} />);

    expect(screen.getByText(/jack is still learning/i)).toBeInTheDocument();
    expect(screen.getByText(/mark your bangers so jack can study your style/i)).toBeInTheDocument();
  });

  it('should persist added rules after save', async () => {
    const configWithoutRules = {
      ...mockInitialConfig,
      customRules: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ config: mockInitialConfig }),
    });

    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={configWithoutRules} />);

    // Add a new rule
    const input = screen.getByPlaceholderText(/e.g., always mention specific numbers/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'mention specific tools' } });
    fireEvent.click(addButton);

    // Save
    const saveButton = screen.getByRole('button', { name: /lock it in/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/tone-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mockUserId,
          customRules: ['mention specific tools'],
        }),
      });
    });
  });

  it('should show example rules to guide users', async () => {
    const { ToneConfigComponent } = await import('@/components/tone-config');
    render(<ToneConfigComponent userId={mockUserId} initialConfig={mockInitialConfig} />);

    expect(screen.getByText(/examples:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/always start with a relatable problem/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/use storytelling format with clear beginning, middle, end/i)).toBeInTheDocument();
  });
});
