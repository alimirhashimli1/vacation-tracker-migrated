import { test, expect } from '@playwright/test';

test.describe('Dashboard (Authenticated)', () => {
  test.beforeAll(async ({ request }) => {
    // Reset database once for this suite to ensure SuperAdmin exists
    const response = await request.post('http://localhost:3001/test/reset');
    expect(response.ok()).toBeTruthy();
  });

  test('should see the dashboard summary cards', async ({ page }) => {
    // Should already be logged in via storageState
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify we are on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Welcome back, System Admin!')).toBeVisible();

    // Verify presence of summary cards
    await expect(page.getByText('Total Accumulated')).toBeVisible();
    await expect(page.getByText('Used Days')).toBeVisible();
    await expect(page.getByText('Remaining Balance')).toBeVisible();
  });

  test('should navigate to User Management as SuperAdmin', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on Team Management link in navbar
    await page.getByRole('link', { name: /Team Management/i }).click();
    
    // Verify redirect to users page
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();
  });
});
