import { test, expect } from '@playwright/test';

test.describe('Authentication flows', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should have a Back to home button', async ({ page }) => {
      const backBtn = page.getByRole('link', { name: /back to home/i });
      await expect(backBtn).toBeVisible();
      await expect(backBtn).toHaveAttribute('href', '/');
    });

    test('should show error when email is empty', async ({ page }) => {
      // Don't fill email, just click login
      await page.getByRole('button', { name: /log in/i }).click();
      await expect(page.getByText('Please enter your email.')).toBeVisible();
    });

    test('should show error on invalid email format', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalidemail');
      await page.getByRole('button', { name: /log in/i }).click();
      await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    });

    test('should clear password field on wrong password', async ({ page }) => {
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /log in/i }).click();

      // Assuming Supabase auth fails and returns "Invalid login credentials"
      await expect(page.getByText(/Invalid login credentials/i)).toBeVisible();
      
      // The password field should be cleared
      await expect(page.getByLabel(/password/i)).toHaveValue('');
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should have a Back to home button', async ({ page }) => {
      const backBtn = page.getByRole('link', { name: /back to home/i });
      await expect(backBtn).toBeVisible();
    });

    test('should show error when email is empty', async ({ page }) => {
      await page.getByLabel(/username/i).fill('testuser');
      await page.getByRole('button', { name: /create account/i }).click();
      await expect(page.getByText('Please enter your email.')).toBeVisible();
    });

    test('should show error on short username', async ({ page }) => {
      await page.getByLabel(/username/i).fill('abc');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /create account/i }).click();
      
      await expect(page.getByText('Username must be at least 5 characters.')).toBeVisible();
    });
  });
});
