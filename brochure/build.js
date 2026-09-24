// Builds the AGM HOA Services brochure PDF straight from the digital proposal (index.html).
//
// Each proposal page becomes one landscape sheet with the site's own top bar, left rail,
// and content column; print.css layers print sizing and fonts on top of the site CSS.
// Fee pages are left out, the community name is filled in, and "proposal" wording is
// replaced with "AGM HOA Services". All other copy comes from index.html unchanged,
// apart from em dashes, which are swapped for commas.
//
// Usage: NODE_PATH=$(npm root -g) node brochure/build.js [--png]
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_PDF = path.join(__dirname, 'AGM-HOA-Services-Penny-Lane.pdf');
const COMMUNITY = 'Penny Lane on 170th Ave NE';
const ROUTES = ['about', 'management', 'governance', 'financials', 'compliance', 'facilities', 'technology'];
const W = 1600, H = 1000;

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, r) => {
      const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(ROOT)) { r.statusCode = 403; return r.end(); }
      fs.readFile(f, (e, d) => {
        if (e) { r.statusCode = 404; return r.end(); }
        r.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream');
        r.end(d);
      });
    }).listen(0, () => res(srv));
  });
}

(async () => {
  const srv = await serve();
  const base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  // keep analytics and outbound font requests out of the build
  await page.route(/posthog|fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1400); // let the About metrics count-up finish

  // 1) capture each route's rail + page markup as the live site renders it
  const captured = [];
  for (const route of ROUTES) {
    await page.evaluate(r => document.querySelector(`.nav-link[data-route="${r}"]`).click(), route);
    await page.waitForTimeout(150);
    captured.push(await page.evaluate(r => ({
      route: r,
      rail: document.getElementById('rail').innerHTML,
      body: document.getElementById('page-' + r).innerHTML,
    }), route));
  }

  // 2) rebuild the document as fixed sheets
  await page.evaluate(({ captured, COMMUNITY, ROUTES }) => {
    const tabs = [...document.querySelectorAll('.nav-link')]
      .filter(b => ROUTES.includes(b.dataset.route))
      .map(b => [b.dataset.route, b.textContent.trim()]);
    const footer = document.querySelector('.site-footer');
    footer.querySelector('.sf-confidential')?.remove();
    const pad = x => String(x).padStart(2, '0');

    const topbar = active => `
      <header class="topbar"><div class="topbar-inner">
        <span class="topbar-prop">${COMMUNITY}</span>
        <nav class="nav-links"><div class="nav-tabs">${tabs.map(([r, t]) =>
          `<span class="nav-link${r === active ? ' active' : ''}">${t}</span>`).join('')}</div></nav>
      </div></header>`;

    const sheets = captured.map((c, i) => {
      const rail = document.createElement('div');
      rail.innerHTML = c.rail;
      rail.querySelectorAll('.seg').forEach(s => { if (!ROUTES.includes(s.dataset.route)) s.remove(); });
      rail.querySelector('.rail-num').textContent = `${pad(i + 1)} / ${pad(captured.length)}`;
      const last = i === captured.length - 1;
      return `
      <section class="sheet" data-route="${c.route}">
        ${topbar(c.route)}
        <div class="shell">
          <aside class="rail"><div class="rail-stick">${rail.innerHTML}</div></aside>
          <div class="main"><main class="content"><div class="content-inner">
            <div class="page active" id="page-${c.route}">${c.body}</div>
          </div></main></div>
        </div>
        ${last ? footer.outerHTML : ''}
      </section>`;
    });

    // cover: mirrors the site's cover screen (functions/_middleware.js)
    const toc = tabs.map(([r]) => captured.find(c => c.route === r))
      .map(c => { const d = document.createElement('div'); d.innerHTML = c.rail; return d.querySelector('.rail-label').textContent; })
      .map(l => l.replace(' · Roles', ''));
    const aboutRail = document.createElement('div');
    aboutRail.innerHTML = captured[0].rail;
    const cover = `
      <section class="sheet cover">
        <div class="cv-sheet">
          <header class="cv-head"><span class="cv-eyebrow">AGM Real Estate Group, LLC</span><img src="/assets/agm-logo-black.svg" alt="AGM Real Estate Group" /></header>
          <div class="cv-body">
            <section class="cv-left">
              <h1 class="cv-title">AGM HOA Services</h1>
              <div class="cv-prop">${COMMUNITY}</div>
              <div class="cv-inside">
                <div class="cv-label">Table of Contents</div>
                <ul>${toc.map(t => `<li>${t}</li>`).join('')}</ul>
              </div>
            </section>
            <section class="cv-right">
              <div class="rail-label">About AGM</div>
              <p class="cv-lead">${aboutRail.querySelector('.rail-lead').textContent}</p>
              <div class="rail-watermark" aria-hidden="true"><span>AGM</span></div>
            </section>
          </div>
          <footer class="cv-foot"><span class="cv-contact">206.622.8600 &nbsp;&middot;&nbsp; agmrealestategroup.com &nbsp;&middot;&nbsp; 12330 Northup Way, Bellevue, WA 98005</span></footer>
        </div>
      </section>`;

    document.body.innerHTML = cover + sheets.join('');
    // the About metrics count up on screen; print their final values
    document.querySelectorAll('.m-value[data-val]').forEach(el => { el.textContent = el.dataset.val; });
    document.title = `AGM HOA Services · ${COMMUNITY}`;
    document.documentElement.setAttribute('data-theme', 'light');

    // em dashes out: "X — Y" reads "X, Y"; the footprint's bold lead-in takes a period
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      if (!n.nodeValue.includes('—')) continue;
      const afterStrong = n.previousSibling && n.previousSibling.nodeName === 'STRONG';
      n.nodeValue = n.nodeValue.replace(/^\s*—\s*/, afterStrong ? '. ' : ', ').replace(/\s*—\s*/g, ', ');
    }
  }, { captured, COMMUNITY, ROUTES });

  await page.addStyleTag({ url: `${base}/brochure/print.css` });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  // 3) fit: scale a page's content down only if it is taller than its column
  const fit = await page.$$eval('.sheet[data-route]', sheets => sheets.map(s => {
    const content = s.querySelector('.content'), inner = s.querySelector('.content-inner');
    const cs = getComputedStyle(content);
    const avail = content.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const need = inner.scrollHeight;
    const k = Math.min(1, avail / need);
    if (k < 1) { inner.style.zoom = k.toFixed(3); }
    return `${s.dataset.route}: ${Math.round(need)}px in ${Math.round(avail)}px${k < 1 ? ` → scaled ${(k * 100).toFixed(0)}%` : ''}`;
  }));
  console.log(fit.join('\n'));
  const left = await page.evaluate(() => (document.body.innerText.match(/—|proposal|\$X|fee/gi) || []));
  if (left.length) console.warn('WARNING: leftover wording:', left);

  await page.pdf({ path: OUT_PDF, preferCSSPageSize: true, printBackground: true });
  console.log('wrote', path.relative(ROOT, OUT_PDF));

  if (process.argv.includes('--png')) {
    const dir = process.env.PNG_DIR || __dirname;
    const els = await page.$$('.sheet');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(dir, `sheet-${i + 1}.png`) });
  }
  await browser.close();
  srv.close();
})();
