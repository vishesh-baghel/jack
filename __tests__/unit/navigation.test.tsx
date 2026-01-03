/**
 * Navigation Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '@/components/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  getUserSession: vi.fn(() => ({ isGuest: false })),
  clearUserSession: vi.fn(),
}));

import { usePathname } from 'next/navigation';
import { getUserSession } from '@/lib/auth-client';

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default values after clearAllMocks
    vi.mocked(usePathname).mockReturnValue('/');
    vi.mocked(getUserSession).mockReturnValue({ isGuest: false } as any);
    global.fetch = vi.fn();
  });

  it('should render logo without "content agent" text', () => {
    render(<Navigation />);

    expect(screen.getByText('jack')).toBeInTheDocument();
    expect(screen.queryByText('content agent')).not.toBeInTheDocument();
  });

  it('should render all navigation links', () => {
    render(<Navigation />);

    // Check desktop navigation
    expect(screen.getByText('ideas')).toBeInTheDocument();
    expect(screen.getByText('posts')).toBeInTheDocument();
    expect(screen.getByText('creators')).toBeInTheDocument();
    expect(screen.getByText('settings')).toBeInTheDocument();
  });

  it('should show hamburger menu button on mobile', () => {
    render(<Navigation />);

    // Find hamburger menu button (has sr-only "Menu" text)
    const menuButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('span.sr-only')?.textContent === 'Menu'
    );

    expect(menuButton).toBeInTheDocument();
  });

  it('should display visitor mode badge when guest', () => {
    vi.mocked(getUserSession).mockReturnValue({ isGuest: true } as any);

    render(<Navigation />);

    expect(screen.getByText('visitor mode')).toBeInTheDocument();
  });

  it('should not display visitor mode badge for regular users', () => {
    vi.mocked(getUserSession).mockReturnValue({ isGuest: false } as any);

    render(<Navigation />);

    expect(screen.queryByText('visitor mode')).not.toBeInTheDocument();
  });

  it('should highlight active navigation link', () => {
    vi.mocked(usePathname).mockReturnValue('/creators');

    render(<Navigation />);

    // The active link should have specific styling classes
    const creatorsLinks = screen.getAllByText('creators');
    const activeLink = creatorsLinks.find(link =>
      link.className.includes('bg-primary')
    );

    expect(activeLink).toBeInTheDocument();
  });

  it('should not render on auth page', () => {
    vi.mocked(usePathname).mockReturnValue('/auth');

    const { container } = render(<Navigation />);

    expect(container.firstChild).toBeNull();
  });

  it('should call logout API when logout button clicked', async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    render(<Navigation />);

    // Find and click logout button
    const logoutButtons = screen.getAllByRole('button');
    const logoutButton = logoutButtons.find(btn => btn.getAttribute('aria-label') === 'Logout');

    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton!);

    // Wait for fetch to be called
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });
  });

  it('should disable logout button while logging out', async () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true } as Response), 100))
    );

    render(<Navigation />);

    const logoutButtons = screen.getAllByRole('button');
    const logoutButton = logoutButtons.find(btn => btn.getAttribute('aria-label') === 'Logout');

    fireEvent.click(logoutButton!);

    expect(logoutButton).toBeDisabled();
  });

  it('should have proper accessibility attributes', () => {
    render(<Navigation />);

    // Navigation should be in a nav element
    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();

    // Logout button should have aria-label
    const logoutButtons = screen.getAllByRole('button');
    const logoutButton = logoutButtons.find(btn => btn.getAttribute('aria-label') === 'Logout');
    expect(logoutButton?.getAttribute('aria-label')).toBe('Logout');
  });
});
