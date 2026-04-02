const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'phx-docs', 'screenshots');
const BASE_URL = 'http://localhost:5000';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/s/al-noor-travel`);
  await sleep(3000);

  const individualBtns = await page.$$('button:has-text("Individual")');
  if (individualBtns.length > 0) {
    await individualBtns[0].click();
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18_pilgrim_individual_booking.png') });
    console.log('Captured: 18_pilgrim_individual_booking.png');

    const closeBtn = await page.$('button[aria-label="Close"], button:has-text("Close"), [role="dialog"] button:first-child');
    if (closeBtn) {
      await closeBtn.click();
      await sleep(1000);
    } else {
      await page.keyboard.press('Escape');
      await sleep(1000);
    }
  }

  const groupBtns = await page.$$('button:has-text("Group")');
  if (groupBtns.length > 0) {
    await groupBtns[0].click();
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '19_pilgrim_group_csv_booking.png') });
    console.log('Captured: 19_pilgrim_group_csv_booking.png');
  }

  await ctx.close();
  await browser.close();
  console.log('Done');
})();
