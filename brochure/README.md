# AGM HOA Services Brochure (PDF)

A five-page US Letter brochure of the HOA proposal, prepared for **Penny Lane on 170th Ave NE**.

- `AGM-HOA-Services-Penny-Lane.pdf`: the finished brochure
- `agm-hoa-services-brochure.html`: the source layout. Edit it here.
- `build.js`: renders the PDF with Playwright/Chromium
- `check_copy.py`: lists any brochure text that is not word for word in `index.html`

Copy rules: all headings and body text come from the proposal (`index.html`), unchanged. Only
three things differ:
- the fee pages are left out
- the cover title reads "AGM HOA Services" and the community name is filled in
- em dashes are replaced with commas (one, after a bold lead-in, with a period)

Headings use Instrument Serif and body text uses Inter (both OFL, self-hosted in `fonts/`).

Rebuild from the repo root: `NODE_PATH=$(npm root -g) node brochure/build.js` (add `--png` for
page previews), then run `python3 brochure/check_copy.py`.
