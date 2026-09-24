// Renders agm-hoa-services-brochure.html to a US Letter PDF (+ optional page PNG previews).
// Usage: NODE_PATH=$(npm root -g) node build.js [--png]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(__dirname, 'agm-hoa-services-brochure.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.$$eval('.page', ps => ps.map((p, i) => {
    const spare = [...p.querySelectorAll(':scope > .sp-s, :scope > .sp-m, :scope > .sp-l, :scope > .end')]
      .reduce((h, el) => h + el.getBoundingClientRect().height - parseFloat(getComputedStyle(el).flexBasis), 0);
    return `page ${i + 1}: ${p.scrollHeight > p.clientHeight ? 'OVERFLOW by ' + (p.scrollHeight - p.clientHeight) + 'px' : Math.round(spare) + 'px spare'}`;
  }));
  console.log(overflow.join('\n'));
  await page.pdf({ path: path.join(__dirname, 'AGM-HOA-Services-Penny-Lane.pdf'), preferCSSPageSize: true, printBackground: true });
  if (process.argv.includes('--png')) {
    const out = process.env.PNG_DIR || __dirname;
    const ps = await page.$$('.page');
    for (let i = 0; i < ps.length; i++) await ps[i].screenshot({ path: path.join(out, `page-${i + 1}.png`) });
  }
  await browser.close();
})();
