import { test, expect } from '@playwright/test';

test('homepage loads and shows auth modal', async ({ page }) => {
  await page.goto('/');

  // Should show auth modal since no user
  await expect(page.locator('text=Welcome Back')).toBeVisible();
  await expect(page.locator('text=Sign in to your account')).toBeVisible();
});

test('can switch to signup', async ({ page }) => {
  await page.goto('/');

  // Click signup link
  await page.click('text=Don\'t have an account? Sign up');

  // Should show signup modal
  await expect(page.locator('text=Create Account')).toBeVisible();
  await expect(page.locator('text=Join the local discovery community')).toBeVisible();
});

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Skip link should be present
  await expect(page.locator('text=Skip to main content')).toBeVisible();
});