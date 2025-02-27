const puppeteer = require('puppeteer');

async function scrapeWebsites(urls) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const results = [];

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for a specific element to load
    await page.waitForSelector('.specific-element-class');

    // Scrape text content from multiple elements
    const elements = await page.$$('.specific-element-class');
    const texts = await Promise.all(elements.map(element => element.evaluate(el => el.textContent)));

    results.push({ url, texts });
  }

  await browser.close();
  return results;
}

// Example usage
const urls = ['https://example1.com', 'https://example2.com'];
scrapeWebsites(urls).then(results => console.log(results));