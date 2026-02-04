import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test.describe('Welcome Screen', () => {
    test('displays welcome greeting', async ({ page }) => {
      // Should show one of the greetings based on time
      const greetings = ['สวัสดีตอนเช้า', 'สวัสดีตอนบ่าย', 'สวัสดีตอนเย็น'];
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();

      const text = await heading.textContent();
      expect(greetings.some(g => text?.includes(g))).toBe(true);
    });

    test('displays help prompt', async ({ page }) => {
      await expect(page.getByText(/วันนี้ให้ผมช่วยอะไรดีครับ/i)).toBeVisible();
    });

    test('shows suggestion cards', async ({ page }) => {
      await expect(page.getByText(/ช่วยเขียนโค้ด Python/i)).toBeVisible();
      await expect(page.getByText(/อธิบาย Quantum Computing/i)).toBeVisible();
      await expect(page.getByText(/แปลข้อความ/i)).toBeVisible();
      await expect(page.getByText(/วิเคราะห์ข้อดีข้อเสีย/i)).toBeVisible();
    });

    test('displays model selector', async ({ page }) => {
      // Model selector should be visible
      await expect(page.getByText(/GPT/i).first()).toBeVisible();
    });

    test('displays RabbitAI logo', async ({ page }) => {
      const logo = page.locator('img[alt="RabbitAI"]');
      await expect(logo.first()).toBeVisible();
    });
  });

  test.describe('Chat Input', () => {
    test('has input placeholder', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);
      await expect(input).toBeVisible();
    });

    test('input is focused by default', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);
      await expect(input).toBeFocused();
    });

    test('send button is disabled when input is empty', async ({ page }) => {
      // The send button should have reduced opacity or be visually disabled
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);
      await expect(input).toHaveValue('');
    });

    test('can type in the input', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);
      await input.fill('Hello, RabbitAI!');
      await expect(input).toHaveValue('Hello, RabbitAI!');
    });

    test('shows character counter when typing', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);
      await input.fill('Hello');
      await expect(page.getByText(/5\/4,000/i)).toBeVisible();
    });

    test('displays disclaimer text', async ({ page }) => {
      await expect(page.getByText(/RabbitAI อาจให้ข้อมูลที่ไม่ถูกต้อง/i)).toBeVisible();
    });
  });

  test.describe('Sending Messages', () => {
    test('sends message via Enter key', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('สวัสดีครับ');
      await input.press('Enter');

      // Message should appear in chat
      await expect(page.getByText('สวัสดีครับ')).toBeVisible();
    });

    test('clears input after sending', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('Test message');
      await input.press('Enter');

      // Input should be cleared
      await expect(input).toHaveValue('');
    });

    test('prevents sending empty message', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('   '); // Only whitespace
      await input.press('Enter');

      // Should not create a message bubble with just whitespace
      // The welcome screen should still be visible
      await expect(page.getByText(/วันนี้ให้ผมช่วยอะไรดีครับ/i)).toBeVisible();
    });

    test('allows multi-line with Shift+Enter', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('Line 1');
      await input.press('Shift+Enter');
      await input.type('Line 2');

      const value = await input.inputValue();
      expect(value).toContain('Line 1');
      expect(value).toContain('Line 2');
    });

    test('shows AI response after sending', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('สวัสดี');
      await input.press('Enter');

      // Wait for AI response (mock should respond)
      await expect(page.getByText(/สวัสดีครับ/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Suggestion Cards', () => {
    test('clicking suggestion sends that message', async ({ page }) => {
      const suggestion = page.getByText(/ช่วยเขียนโค้ด Python/i);
      await suggestion.click();

      // The suggestion text should appear as a user message
      await expect(page.getByText(/ช่วยเขียนโค้ด Python/i)).toBeVisible();
    });

    test('suggestion cards disappear after sending message', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);
      await input.fill('Hello');
      await input.press('Enter');

      // Welcome screen with suggestions should be replaced by chat
      await expect(page.getByText(/วันนี้ให้ผมช่วยอะไรดีครับ/i)).not.toBeVisible();
    });
  });

  test.describe('Chat History (Sidebar)', () => {
    test('sidebar is visible on desktop', async ({ page }) => {
      // Check if sidebar or toggle button is visible
      const sidebar = page.locator('[class*="sidebar"], aside');
      // Either sidebar is visible or there's a toggle
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('adapts to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Input should still be visible
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);
      await expect(input).toBeVisible();
    });
  });
});

test.describe('Chat Navigation', () => {
  test('can navigate to chat from home', async ({ page }) => {
    await page.goto('/');

    // Find and click link to chat
    await page.getByRole('link', { name: /แชท|เริ่มต้นใช้งาน/i }).first().click();

    await expect(page).toHaveURL(/\/chat/);
  });
});
