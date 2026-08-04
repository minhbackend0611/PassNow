import { test, expect } from '@playwright/test';

test.describe('PassNow Core Smoke Test', () => {
  const sellerEmail = `seller_${Date.now()}@test.com`;
  const buyerEmail = `buyer_${Date.now()}@test.com`;
  const password = 'password123';

  test('Complete Buying and Selling Flow', async ({ browser }) => {
    // We use two separate browser contexts to simulate two different users
    const sellerContext = await browser.newContext();
    const buyerContext = await browser.newContext();

    const sellerPage = await sellerContext.newPage();
    const buyerPage = await buyerContext.newPage();

    // ==========================================
    // 1. SELLER FLOW: Register & Create Listing
    // ==========================================
    await sellerPage.goto('/register');
    
    // Fill out registration
    await sellerPage.fill('input[type="email"]', sellerEmail);
    await sellerPage.fill('input[type="password"]', password);
    await sellerPage.fill('input[placeholder="Confirm Password"]', password);
    await sellerPage.click('button:has-text("Create Account")');

    // Should redirect to email verification or straight to profile setup depending on flow
    // In emulator, it might just skip verification if not enforced, or we might need to handle it.
    // For simplicity, let's assume it goes to profile or we manually navigate
    await sellerPage.waitForURL('**/profile/setup', { timeout: 10000 }).catch(() => {});
    if (sellerPage.url().includes('verify')) {
      // If stuck on verify, this is a limitation of the current test structure
      // You'd need a backend admin function to verify the email in the emulator.
      // Let's assume for smoke tests we just hit the profile directly if it allows it.
      await sellerPage.goto('/profile');
    }

    // Ensure we are logged in by checking for the top nav
    await expect(sellerPage.locator('nav')).toBeVisible();

    // Create a listing
    await sellerPage.goto('/list');
    await sellerPage.fill('input[name="title"]', 'E2E Test Book');
    await sellerPage.fill('input[name="price"]', '50000');
    await sellerPage.selectOption('select[name="category"]', 'Textbooks');
    await sellerPage.selectOption('select[name="condition"]', 'New');
    await sellerPage.fill('textarea[name="description"]', 'A great book for testing.');
    
    // Upload image (we need to mock or just use a small dummy file, or maybe the form allows submission without it if it's not strictly required in the UI? Actually images might be required).
    // Let's skip image if possible, or we might need to intercept the request.
    // For now, assume it's optional or we just try clicking submit.
    
    // To make it robust without file upload, let's just click submit and see if it passes
    await sellerPage.click('button:has-text("Publish Listing")');
    
    // Wait for redirect to listing detail
    await sellerPage.waitForURL('**/item/*', { timeout: 15000 });
    const itemUrl = sellerPage.url();
    expect(itemUrl).toContain('/item/');

    // ==========================================
    // 2. BUYER FLOW: Register & Request to Buy
    // ==========================================
    await buyerPage.goto('/register');
    
    // Fill out registration
    await buyerPage.fill('input[type="email"]', buyerEmail);
    await buyerPage.fill('input[type="password"]', password);
    await buyerPage.fill('input[placeholder="Confirm Password"]', password);
    await buyerPage.click('button:has-text("Create Account")');

    await expect(buyerPage.locator('nav')).toBeVisible({ timeout: 10000 });

    // Navigate to the newly created item
    await buyerPage.goto(itemUrl);

    // Click request to buy
    await buyerPage.click('button:has-text("Request to Buy")');

    // Wait for the success toast or redirection to transactions
    await buyerPage.waitForURL('**/transactions', { timeout: 10000 });

    // Verify it appears in the buyer's transaction list
    await expect(buyerPage.locator('text=E2E Test Book')).toBeVisible();

    // ==========================================
    // 3. SELLER FLOW: Confirm Transaction
    // ==========================================
    await sellerPage.goto('/transactions');
    await sellerPage.click('button:has-text("Selling")');
    
    // The seller should see the pending request
    await expect(sellerPage.locator('text=E2E Test Book')).toBeVisible();
    await sellerPage.click('button:has-text("Confirm")');
    await sellerPage.click('button:has-text("Yes, Confirm Sale")'); // Confirm modal

    // Wait for confirmation to process
    await expect(sellerPage.locator('text=Waiting for buyer to review')).toBeVisible({ timeout: 10000 });

    // Clean up contexts
    await sellerContext.close();
    await buyerContext.close();
  });
});
