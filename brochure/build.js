// Renders agm-hoa-services-brochure.html to US Letter PDFs, one per community
// (+ optional page PNG previews). Only the community name and address change between
// builds; everything else comes from the same brochure source.
// Usage from repo root: NODE_PATH=$(npm root -g) node brochure/build.js [community-key] [--png]
const { chromium } = require('playwright');
const path = require('path');

const COMMUNITIES = {
  'penny-lane': {
    name: 'Penny Lane on 170th Ave NE',
    address: '',
    pdf: 'AGM-HOA-Services-Penny-Lane.pdf',
  },
  westwind: {
    name: 'Westwind Condominium Owners Association',
    address: '101115 NE 62nd Street Kirkland, WA 98033',
    pdf: 'AGM-HOA-Services-Westwind.pdf',
  },
};

(async () => {
  const keys = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const targets = keys.length ? keys : Object.keys(COMMUNITIES);
  const browser = await chromium.launch();
  for (const key of targets) {
    const c = COMMUNITIES[key];
    if (!c) throw new Error(`unknown community "${key}" (have: ${Object.keys(COMMUNITIES).join(', ')})`);
    const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
    await page.goto('file://' + path.join(__dirname, 'agm-hoa-services-brochure.html'), { waitUntil: 'networkidle' });
    await page.evaluate(({ name, address }) => {
      document.querySelectorAll('.community').forEach(el => { el.textContent = name; });
      document.querySelectorAll('.addr').forEach(el => { el.textContent = address; });
      document.title = `AGM HOA Services · ${name}`;
    }, c);
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.$$eval('.page', ps => ps.map((p, i) => {
      const spare = [...p.querySelectorAll(':scope > .sp-s, :scope > .sp-m, :scope > .sp-l, :scope > .end')]
        .reduce((h, el) => h + el.getBoundingClientRect().height - parseFloat(getComputedStyle(el).flexBasis), 0);
      return `page ${i + 1}: ${p.scrollHeight > p.clientHeight ? 'OVERFLOW by ' + (p.scrollHeight - p.clientHeight) + 'px' : Math.round(spare) + 'px spare'}`;
    }));
    console.log(`${key}\n  ${overflow.join('\n  ')}`);
    await page.pdf({ path: path.join(__dirname, c.pdf), preferCSSPageSize: true, printBackground: true });
    if (process.argv.includes('--png')) {
      const out = process.env.PNG_DIR || __dirname;
      const ps = await page.$$('.page');
      for (let i = 0; i < ps.length; i++) await ps[i].screenshot({ path: path.join(out, `${key}-page-${i + 1}.png`) });
    }
    await page.close();
  }
  await browser.close();
})();
