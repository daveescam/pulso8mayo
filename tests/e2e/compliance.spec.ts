import { test, expect } from '@playwright/test';

test.describe('Compliance Dashboards', () => {
  test('should redirect unauthenticated users to login when accessing compliance', async ({ page }) => {
    await page.goto('/dashboard/compliance');
    await expect(page).toHaveURL(/.*\/sign-in.*/);
  });
});
