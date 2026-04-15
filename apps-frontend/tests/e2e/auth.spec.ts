import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  // Ensure we start unauthenticated for this suite
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ request }) => {
    // Reset database before each test in this suite
    const response = await request.post('http://localhost:3000/test/reset');
    expect(response.ok()).toBeTruthy();
  });

  test('should login successfully with superadmin credentials and logout', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login');

    // 2. Fill login form
    await page.getByLabel(/Email Address/i).fill('alimirhashimli@gmail.com');
    await page.getByLabel(/Password/i).fill('1Kaybettim.');
    
    // 3. Click sign in
    await page.getByRole('button', { name: /Sign in/i }).click();

    // 4. Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/AbsenceManager/i)).toBeVisible();
    await expect(page.getByText('Welcome back, System Admin!')).toBeVisible();

    // 5. Verify LocalStorage persistence
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).not.toBeNull();
    expect(token?.length).toBeGreaterThan(0);

    // 6. Logout
    // On desktop, the logout button is visible. On mobile, it's in a menu.
    const logoutButton = page.getByRole('button', { name: /Logout/i });
    if (await logoutButton.isVisible()) {
        await logoutButton.click();
    } else {
        await page.getByRole('button', { name: /Open main menu/i }).click();
        await page.getByRole('button', { name: /Logout/i }).click();
    }

    // 7. Verify redirect back to login
    await expect(page).toHaveURL(/\/login/);

    // 8. Verify LocalStorage token is removed
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfterLogout).toBe(null);
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Email Address/i).fill('wrong@example.com');
    await page.getByLabel(/Password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Sign in/i }).click();

    // The error message is actually in a div with role alert or just text
    await expect(page.getByText(/Login failed/i).or(page.getByText(/check your credentials/i))).toBeVisible();
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();
  });
});
