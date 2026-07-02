const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

    await page.goto('https://www.businesstask.shop', { waitUntil: 'networkidle0' });
    
    console.log("Page loaded successfully.");
    await browser.close();
  } catch (err) {
    console.error("SCRIPT ERROR:", err);
  }
})();
