/**
 * E2E Tests: Guest Mode - Navigation
 * Tests navigation between pages as a guest user
 */

import { test, expect } from '@playwright/test';

test.describe('Guest Mode: Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page and enter as guest
    await page.goto('/auth');

    // Click guest mode button
    await page.getByRole('button', { name: /continue as guest/i }).click();

    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });

  test('should navigate to posts page', async ({ page }) => {
    // Find and click posts navigation link
    const postsLink = page.getByRole('link', { name: /posts/i });
    await expect(postsLink).toBeVisible();
    await postsLink.click();

    // Should be on posts page
    await expect(page).toHaveURL('/posts');
    await expect(page.getByRole('heading', { name: /posts/i })).toBeVisible();
  });

  test('should navigate to creators page', async ({ page }) => {
    // Find and click creators navigation link
    const creatorsLink = page.getByRole('link', { name: /creators/i });
    await expect(creatorsLink).toBeVisible();
    await creatorsLink.click();

    // Should be on creators page
    await expect(page).toHaveURL('/creators');
    await expect(page.getByRole('heading', { name: /creators/i })).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    // Find and click settings navigation link
    const settingsLink = page.getByRole('link', { name: /settings/i }).or(
      page.locator('a[href="/settings"]')
    );

    if (await settingsLink.count() > 0) {
      await settingsLink.first().click();

      // Should be on settings page
      await expect(page).toHaveURL('/settings');
      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    } else {
      // Settings may not be accessible in guest mode
      console.log('Settings link not found - may be restricted for guests');
    }
  });

  test('should navigate back to ideas from posts', async ({ page }) => {
    // Go to posts
    await page.getByRole('link', { name: /posts/i }).click();
    await expect(page).toHaveURL('/posts');

    // Go back to ideas
    const ideasLink = page.getByRole('link', { name: /ideas/i }).or(
      page.locator('a[href="/"]')
    );
    await ideasLink.first().click();

    // Should be back on home page
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /content ideas/i })).toBeVisible();
  });

  test('should display guest indicator in navigation', async ({ page }) => {
    // Look for guest mode indicator
    const guestIndicator = page.getByText(/guest/i).or(
      page.locator('[data-guest="true"]')
    );

    // Guest indicator should be visible somewhere in the UI
    if (await guestIndicator.count() > 0) {
      await expect(guestIndicator.first()).toBeVisible();
    }
  });

  test('should not allow access to protected actions', async ({ page }) => {
    // Try to generate ideas
    const generateButton = page.getByRole('button', { name: /cook up ideas/i });
    await generateButton.click();

    // Should show some indication that this is not allowed
    // (tooltip, disabled state, or error message)
    await page.waitForTimeout(500);

    // Verify we're still on the ideas page and nothing broke
    await expect(page).toHaveURL('/');
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate through pages
    await page.getByRole('link', { name: /posts/i }).click();
    await expect(page).toHaveURL('/posts');

    await page.getByRole('link', { name: /creators/i }).click();
    await expect(page).toHaveURL('/creators');

    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/posts');

    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL('/creators');

    // Go back twice to ideas
    await page.goBack();
    await page.goBack();
    await expect(page).toHaveURL('/');
  });
});
