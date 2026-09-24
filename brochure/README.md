# AGM HOA Services — Brochure (PDF)

Five-page US Letter brochure built from the HOA micro-site copy, with all fees removed. The design
follows the AGM generic services flyer: black hero, periwinkle blue accents, a light serif paired
with tracked sans-serif labels.

- `AGM-HOA-Services-Penny-Lane.pdf`: the finished brochure (prepared for Penny Lane · 170th Ave NE)
- `agm-hoa-services-brochure.html`: the source. Edit the copy here.
- `build.js`: renders the PDF with Playwright/Chromium

Rebuild: `NODE_PATH=$(npm root -g) node brochure/build.js` (add `--png` for page previews).
Fonts (Newsreader, Inter; OFL) are self-hosted in `fonts/` so the build runs offline.
