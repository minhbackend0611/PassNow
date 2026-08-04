import { test, expect } from '@playwright/test';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    async function handleSetupProfile(page: any, name: string) {
        await page.waitForURL('**/setup-profile', { timeout: 10000 }).catch(() => {});
        if (page.url().includes('setup-profile')) {
            await page.fill('input[name="displayName"]', name);
            await page.selectOption('select[name="school"]', { index: 1 });
            
            await page.waitForSelector('select[name="province"] option:nth-child(2)', { state: 'attached', timeout: 15000 });
            await page.selectOption('select[name="province"]', { index: 1 });
            
            await page.waitForSelector('select[name="district"] option:nth-child(2)', { state: 'attached', timeout: 15000 });
            await page.selectOption('select[name="district"]', { index: 1 });
            
            await page.click('button:has-text("Complete Setup")');
            await page.waitForURL((url: URL) => !url.toString().includes('setup-profile'), { timeout: 15000 });
        }
    }

    // ==========================================
    // 1. SELLER FLOW: Register & Create Listing
    // ==========================================
    await sellerPage.goto('/register');
    
    // Fill out registration
    await sellerPage.fill('input[type="email"]', sellerEmail);
    await sellerPage.fill('input[type="password"]', password);
    await sellerPage.fill('input[placeholder="Repeat password"]', password);
    await sellerPage.click('button:has-text("Register")');

    // Might redirect to setup profile
    await handleSetupProfile(sellerPage, 'Test Seller');

    // Go to list page
    await sellerPage.goto('/list');
    await sellerPage.fill('input[name="title"]', 'E2E Test Book');
    await sellerPage.fill('input[name="price"]', '50000');
    
    // Interact with CustomSelect for Category
    await sellerPage.click('button:has-text("Select Category")');
    await sellerPage.click('button:has-text("Textbooks")');

    // Interact with CustomSelect for Condition
    await sellerPage.click('button:has-text("Select Condition")');
    await sellerPage.click('button:has-text("New")');
    
    await sellerPage.fill('textarea[name="description"]', 'A great book for testing.');
    
    // specificAddress is required
    await sellerPage.fill('input[name="specificAddress"]', '123 Test Street');

    // Upload dummy image
    await sellerPage.setInputFiles('input[type="file"]', path.resolve(__dirname, 'dummy.png'));

    // Wait for image to render in DOM
    await expect(sellerPage.locator('img[alt="Preview 0"]')).toBeVisible({ timeout: 5000 });
    
    // Click submit
    await sellerPage.click('button:has-text("Post Listing")');
    
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
    await buyerPage.fill('input[placeholder="Repeat password"]', password);
    await buyerPage.click('button:has-text("Register")');

    await handleSetupProfile(buyerPage, 'Test Buyer');

    await expect(buyerPage.locator('nav')).toBeVisible({ timeout: 10000 });

    // Navigate to the newly created item
    await buyerPage.goto(itemUrl);

    // Click request to buy
    await buyerPage.click('button:has-text("Request to Buy")');

    // Wait for the success toast or redirection to transactions
    await buyerPage.waitForURL('**/transactions', { timeout: 10000 });

    // Verify it appears in the buyer's transaction list
    await expect(buyerPage.locator('text=E2E Test Book').first()).toBeVisible();

    // ==========================================
    // 3. SELLER FLOW: Confirm Transaction
    // ==========================================
    await sellerPage.goto('/transactions');
    await sellerPage.click('button:has-text("Selling")');
    
    // The seller should see the pending request
    await expect(sellerPage.locator('text=E2E Test Book').first()).toBeVisible();
    await sellerPage.click('button:has-text("Confirm")');
    await sellerPage.click('button:has-text("Yes, Confirm Sale")'); // Confirm modal

    // Wait for confirmation to process
    await expect(sellerPage.locator('text=Waiting for buyer to review').first()).toBeVisible({ timeout: 10000 });

    // Clean up contexts
    await sellerContext.close();
    await buyerContext.close();
  });
});
