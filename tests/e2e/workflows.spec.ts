import { test, expect } from '@playwright/test';

test.describe('Workflows Navigation', () => {
  // Assuming the user is required to be logged in to see workflows.
  // In a real E2E environment, you would use global setup for auth state.
  // For this MVP check, we will verify that a protected route redirects to sign-in.
  
  test('should redirect unauthenticated users to login when accessing workflows', async ({ page }) => {
    await page.goto('/dashboard/workflows');
    
    // Better Auth middleware redirects to /sign-in
    await expect(page).toHaveURL(/.*\/sign-in.*/);
  });
});
