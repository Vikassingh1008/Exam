const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/student/login');
  
  // Login
  await page.type('input[type="email"]', 'vikas@example.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  console.log('Navigated to:', page.url());
  
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  if (content.includes('Loading tests...')) {
    console.log('Still loading tests after 2 seconds!');
  } else {
    console.log('Tests loaded successfully.');
    
    // Check if Police category exists
    const categories = await page.$$eval('select:nth-of-type(1) option', options => options.map(o => o.textContent));
    console.log('Categories dropdown:', categories);
    
    // Check tests rendered
    const tests = await page.$$eval('article h4', h4s => h4s.map(h => h.textContent));
    console.log('Tests rendered:', tests);
  }
  
  await browser.close();
})();
