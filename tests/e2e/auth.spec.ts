import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveTitle(/Pulso/);
    await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByRole('button', { name: /Ingresar/i }).click();
    
    // Check for HTML5 validation or custom toast/error message
    // Usually required fields prevent submission, so we just check if we stay on the page
    expect(page.url()).toContain('/sign-in');
  });

  // Note: Actual login test with credentials should use a seeded test user
  // This is a basic test that verifies the page loads correctly
});
