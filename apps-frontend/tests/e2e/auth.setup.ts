import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate as SuperAdmin', async ({ page }) => {
  // 1. Go to login page
  await page.goto('/login');

  // 2. Fill login form
  await page.getByLabel(/Email Address/i).fill('alimirhashimli@gmail.com');
  await page.getByLabel(/Password/i).fill('1Kaybettim.');
  
  // 3. Click sign in
  await page.getByRole('button', { name: /Sign in/i }).click();

  // 4. Check for error messages if the URL doesn't change
  const loginError = page.getByText(/Login failed/i);
  const invalidCreds = page.getByText(/check your credentials/i);
  
  // Wait for either the dashboard or an error message
  await Promise.race([
    page.waitForURL(/\/dashboard/),
    expect(loginError).toBeVisible({ timeout: 5000 }).catch(() => {}),
    expect(invalidCreds).toBeVisible({ timeout: 5000 }).catch(() => {})
  ]);

  // 5. Verify redirect to dashboard
  if (page.url().includes('/login')) {
      const errorMessage = await page.locator('.bg-red-50').textContent();
      console.error('Login failed with error:', errorMessage?.trim());
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/login-failure.png' });
  }
  
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Welcome back, System Admin!')).toBeVisible();

  // 6. Save storage state
  await page.context().storageState({ path: authFile });
});
