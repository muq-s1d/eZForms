import { test, expect } from '@playwright/test';

test.describe('Form Password Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Supabase API calls
    await page.route('**/rest/v1/forms*', async (route) => {
      if (route.request().method() === 'GET') {
        // .single() expects a single object when the header 'Accept': 'application/vnd.pgrst.object+json' is used
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-id',
            title: 'Mocked Password Form',
            description: 'This is a test',
            password: 'correctpassword',
            is_active: true,
            creator_id: '123'
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/rest/v1/participants*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/rest/v1/questions*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/form/test-id/fill');
  });

  test('should have a Back to home button', async ({ page }) => {
    // Wait for password gate to render
    await expect(page.getByText('This form is password protected.')).toBeVisible();

    const backBtn = page.getByRole('link', { name: /back to home/i });
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toHaveAttribute('href', '/');
  });

  test('should clear password field on incorrect password', async ({ page }) => {
    await expect(page.getByText('This form is password protected.')).toBeVisible();

    const passwordInput = page.getByPlaceholder(/enter password/i);
    await passwordInput.fill('wrongpassword');
    
    await page.getByRole('button', { name: /unlock form/i }).click();

    // Should show error message
    await expect(page.getByText('Incorrect password')).toBeVisible();
    
    // The password field should be cleared
    await expect(passwordInput).toHaveValue('');
  });
});
