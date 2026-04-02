const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'phx-docs', 'pdf', 'PHX_Investor_Pitch_Deck.pdf');
const HTML_PATH = path.join(__dirname, 'pitch-deck.html');

async function main() {
  const html = fs.readFileSync(HTML_PATH, 'utf-8');
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.pdf({
    path: OUTPUT,
    width: '1280px',
    height: '720px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  const stats = fs.statSync(OUTPUT);
  console.log(`Done! ${OUTPUT} (${(stats.size/1024).toFixed(0)} KB)`);
  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
