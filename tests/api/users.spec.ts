import { test, expect } from '@playwright/test';

test.describe('Users API', () => {
  test('should return 401 Unauthorized without session', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(401);
  });
});
