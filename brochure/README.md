# AGM HOA Services Brochure (PDF)

A seven-page US Letter brochure of the HOA proposal. The same design is built once per community:

| Community | PDF |
|---|---|
| Penny Lane on 170th Ave NE | `AGM-HOA-Services-Penny-Lane.pdf` |
| Westwind Condominium Owners Association, 101115 NE 62nd Street Kirkland, WA 98033 | `AGM-HOA-Services-Westwind.pdf` |

To add a community, add an entry (name, optional address, PDF filename) to `COMMUNITIES` in `build.js`.

- `agm-hoa-services-brochure.html`: the source layout. Edit it here.
- `build.js`: renders one PDF per community with Playwright/Chromium
- `check_copy.py`: lists any brochure text that is not word for word in `index.html`

Copy rules: all headings and body text come from the proposal (`index.html`), unchanged. Only
four things differ:
- the fee pages are left out
- the cover title reads "AGM HOA Services" and the community name is filled in
- "Property Manager" reads "Community Association Manager"
- em dashes are replaced with commas (one, after a bold lead-in, with a period)

Headings use DM Serif Display and body text uses Inter (both OFL, self-hosted in `fonts/`).

Rebuild from the repo root: `NODE_PATH=$(npm root -g) node brochure/build.js` (builds every community; pass a key such as `westwind` to build one, and `--png` for
page previews), then run `python3 brochure/check_copy.py`.
