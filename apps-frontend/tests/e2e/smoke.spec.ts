import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  // Ensure we start unauthenticated for this suite
  test.use({ storageState: { cookies: [], origins: [] } });

  test('smoke test - should load the login page', async ({ page }) => {
    await page.goto('/');
    // Redirect to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveTitle(/apps-frontend/i);
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
  });
});
