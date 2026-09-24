# AGM HOA Services Brochure (PDF)

A landscape PDF version of the digital proposal (`index.html`), prepared for **Penny Lane on 170th
Ave NE**. Each proposal page becomes one sheet with the site's own top bar, left rail, and content
column, plus a cover based on the site's cover screen.

- `AGM-HOA-Services-Penny-Lane.pdf`: the finished brochure (cover + 7 sheets, 1600 × 1000)
- `build.js`: renders the PDF straight from `index.html`. Any copy edit to the site carries over
  on the next build.
- `print.css`: the print layer (sheet sizing, tighter spacing, Instrument Serif headings / Inter body)

What the build changes compared with the site:
- leaves out the Fees A / Fees B pages and the "Confidential" footer tag
- fills in the community name, and titles the cover "AGM HOA Services" instead of "Proposal for
  Management Services"
- replaces em dashes with commas

Rebuild from the repo root: `NODE_PATH=$(npm root -g) node brochure/build.js` (add `--png` for sheet
previews). Fonts (Instrument Serif, Inter; OFL) are self-hosted in `fonts/`, so the build runs offline.
