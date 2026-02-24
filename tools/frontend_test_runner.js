const { chromium } = require('playwright');

async function run() {
  const url = process.env.URL || 'http://localhost:5000';
  console.log('Frontend headless runner connecting to', url);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.warn('Initial navigation warning:', e.message || e);
  }

  try {
    // Wait for the in-page test harness to populate results
    await page.waitForFunction(() => {
      return typeof window === 'object' &&
        window.TESTING_CHECKLIST &&
        window.TESTING_CHECKLIST.results &&
        Object.keys(window.TESTING_CHECKLIST.results).length > 0;
    }, { timeout: 60000 });

    const checklist = await page.evaluate(() => window.TESTING_CHECKLIST);

    console.log('\n=== FRONTEND TEST SUMMARY ===');
    const results = checklist.results || {};
    let passes = 0, fails = 0, skipped = 0;
    for (const [name, value] of Object.entries(results)) {
      const status = typeof value === 'string' ? value : (value && value.status) || 'Unknown';
      console.log(`${name}: ${status}`);
      if (status === 'Pass') passes++;
      else if (status === 'Fail') fails++;
      else if (status === 'Skipped') skipped++;
    }

    console.log(`\nPassed: ${passes}  Failed: ${fails}  Skipped: ${skipped}`);

    await browser.close();

    if (fails > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Error waiting for tests or collecting results:', err.message || err);
    await browser.close();
    process.exit(2);
  }
}

run();
