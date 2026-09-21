// Optional development test: npm install --no-save playwright@1.62.1
// npx playwright install chromium && node tests/browser.cjs
// Runtime application has no Node or Playwright dependency.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

(async () => {
  const server = spawn(process.env.PYTHON || 'python', ['-m', 'poker_odds.server', '--port', '8877']);
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
      server.stdout.on('data', data => {
        if (String(data).includes('Open http://')) { clearTimeout(timeout); resolve(); }
      });
      server.on('error', reject);
      server.on('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
    });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8877');
    async function calculate(example) {
      await page.click(`[data-example="${example}"]`);
      await page.click('#submit');
      await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Complete'), null, { timeout: 120000 });
    }
    await calculate(2);
    assert.equal(await page.locator('#eq1').textContent(), '100.000000%');
    assert.equal(await page.locator('#fraction').textContent(), '1');
    await calculate(3);
    assert.equal(await page.locator('#eq1').textContent(), '50.000000%');
    await page.fill('#dead', 'As');
    assert.equal(await page.locator('#results').isVisible(), false);
    await page.click('#submit');
    await page.waitForSelector('#status.error');
    assert.equal(await page.locator('#results').isVisible(), false);
    assert.equal(await page.locator('#submit').isEnabled(), true);
    await page.setViewportSize({ width: 390, height: 844 });
    await calculate(1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const flop = JSON.parse(await page.locator('#raw').textContent());
    assert.equal(flop.total, 903);
    assert.equal(flop.wins + flop.losses + flop.ties, flop.total);
    await page.click('[data-example="0"]');
    await page.click('#submit');
    assert.equal(await page.locator('#submit').isDisabled(), true);
    await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Complete'), null, { timeout: 120000 });
    const preflop = JSON.parse(await page.locator('#raw').textContent());
    assert.equal(preflop.total, 1712304);
    assert.equal(preflop.equity.fraction, '29603/36432');
    assert.equal(preflop.method, 'exact_enumeration');
    assert.deepEqual(errors, []);
    console.log('Browser E2E passed: all streets, dead cards, exact results, errors, busy state and mobile overflow.');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
