/**
 * Unit tests for Visitor Mode Toggle Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('VisitorModeToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render if user is not owner', async () => {
    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    const { container } = render(<VisitorModeToggle isOwner={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show loading state initially for owner', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: false }),
    });

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    expect(screen.getByText(/loading visitor mode settings/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading visitor mode settings/i)).not.toBeInTheDocument();
    });
  });

  it('should fetch and display visitor mode status when owner', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true }),
    });

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText(/visitor mode/i)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/settings/visitor-mode');
  });

  it('should show "active" badge when visitor mode is enabled', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true }),
    });

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('should not show "active" badge when visitor mode is disabled', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: false }),
    });

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText(/visitor mode is off/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('active')).not.toBeInTheDocument();
  });

  it('should not display guest access URL when enabled', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true }),
    });

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText(/visitor mode is on/i)).toBeInTheDocument();
    });

    // Guest access URL section should not be displayed
    expect(screen.queryByText(/guest access url/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/continue as guest/i)).not.toBeInTheDocument();
  });

  it('should toggle visitor mode when clicked', async () => {
    // Initial fetch returns disabled
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enabled: false }),
      })
      // Toggle request returns success
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, enabled: true }),
      });

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/visitor mode is off/i)).toBeInTheDocument();
    });

    // Find and click the toggle button
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/settings/visitor-mode',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true }),
        })
      );
    });
  });

  it('should show error alert when toggle fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enabled: false }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Toggle failed' }),
      });

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText(/visitor mode is off/i)).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Toggle failed');
    });
  });

  it('should disable toggle button while saving', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enabled: false }),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ success: true, enabled: true }),
              } as never);
            }, 100);
          })
      );

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText(/visitor mode is off/i)).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Button should be disabled while saving
    expect(toggleButton).toHaveClass('cursor-not-allowed');
  });

  it('should display correct text based on enabled state', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true }),
    });

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText(/visitor mode is on/i)).toBeInTheDocument();
      expect(screen.getByText(/visitors can browse your content/i)).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockFetch.mockRejectedValue(new Error('Network error'));

    const { VisitorModeToggle } = await import('@/components/visitor-mode-toggle');
    render(<VisitorModeToggle isOwner={true} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});

describe('GuestTooltipButton Component', () => {
  it('should render as regular button when not guest', async () => {
    const { GuestTooltipButton } = await import('@/components/guest-tooltip-button');
    render(
      <GuestTooltipButton isGuest={false}>
        Click me
      </GuestTooltipButton>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should render disabled button when guest', async () => {
    const { GuestTooltipButton } = await import('@/components/guest-tooltip-button');
    render(
      <GuestTooltipButton isGuest={true}>
        Click me
      </GuestTooltipButton>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('should wrap button in tooltip provider when guest', async () => {
    const { GuestTooltipButton } = await import('@/components/guest-tooltip-button');
    const { container } = render(
      <GuestTooltipButton isGuest={true}>
        Action
      </GuestTooltipButton>
    );

    // Verify tooltip trigger span is present
    const tooltipTrigger = container.querySelector('span');
    expect(tooltipTrigger).toBeInTheDocument();
  });
});
