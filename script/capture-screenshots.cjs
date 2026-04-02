const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'phx-docs', 'screenshots');
const BASE_URL = 'http://localhost:5000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`Captured: ${name}.png`);
}

async function captureRole(browser, email, password, steps) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  await page.goto(`${BASE_URL}/auth`);
  await sleep(2000);
  
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await sleep(3000);
  
  for (const step of steps) {
    if (step.path) {
      await page.goto(`${BASE_URL}${step.path}`);
      await sleep(2500);
    }
    await screenshot(page, step.name);
  }
  
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    const ctx0 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const pg0 = await ctx0.newPage();
    await pg0.goto(`${BASE_URL}/auth`);
    await sleep(2000);
    await screenshot(pg0, '01_login_page');
    await ctx0.close();

    await captureRole(browser, 'admin@phxcore.com', 'admin123', [
      { name: '02_admin_dashboard' },
      { path: '/admin/users', name: '03_admin_users' },
      { path: '/admin/reports', name: '04_admin_reports' },
      { path: '/admin/escrow', name: '05_admin_escrow' },
      { path: '/auctions', name: '06_auctions_overview' },
    ]);

    await captureRole(browser, 'almadinah@hotel.com', 'hotel123', [
      { name: '07_hotel_dashboard' },
      { path: '/auctions', name: '08_hotel_auctions' },
    ]);

    await captureRole(browser, 'summit@broker.com', 'broker123', [
      { name: '09_broker_dashboard' },
      { path: '/inventory', name: '10_broker_inventory' },
    ]);

    await captureRole(browser, 'alnoor@agent.com', 'agent123', [
      { name: '11_agent_dashboard' },
      { path: '/marketplace', name: '12_agent_marketplace' },
      { path: '/bookings', name: '13_agent_bookings' },
      { path: '/storefront', name: '14_agent_storefront' },
      { path: '/transactions', name: '15_agent_transactions' },
    ]);

    const ctx5 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const pg5 = await ctx5.newPage();
    await pg5.goto(`${BASE_URL}/s/al-noor-travel`);
    await sleep(2500);
    await screenshot(pg5, '16_public_storefront');
    await ctx5.close();

    console.log('\nAll 16 screenshots captured successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
