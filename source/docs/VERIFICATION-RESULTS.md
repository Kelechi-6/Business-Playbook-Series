# Verification results — 28 October 2026

## Completed

- Automated content/editor/server tests pass; see `npm test` for repeatable details.
- Generated build: 15 HTML pages, 2 book records, 1 series and 2 resources.
- Internal-link crawl: 394 internal references checked; zero broken targets. Every generated HTML page has a title and meta description.
- Added a third book through the actual editor API in an isolated project; its detail page, catalogue/category, series, search and sitemap entries were generated without changing application code.
- Created a new series and a workbook-type product through content records; verified shared templates, optional checkout/preview links, contributor attribution, table of contents and price rendering.
- Edited a record and checked that another book's own details stayed intact; related-book cards updated appropriately.
- Excluded draft text and draft-only cover artwork from public output; unpublished routes/assets return 404.
- Authenticated local editor, same-origin checks, upload restrictions and backup export tested.
- Source export excludes secret environment files, includes `.env.example` and rebuilds in a separate extracted folder. Aggregate JSON content import succeeds with validation.
- Portable Node production adapter serves the generated platform; local editor and development review endpoints are absent in production.
- Desktop browser: homepage appearance, catalogue keyword filtering, cross-site resource search and series reading order checked.
- Phone/tablet review used actual iframe viewports nominally 390 and 768 px wide (375/753 px content area after browser scrollbars). Homepage, catalogue, book and contact layouts were inspected. Phone menu opens and closes with Escape. Catalogue impossible-query empty state works. Measured content width equals viewport width on checked phone pages, with no horizontal overflow.
- Free worksheet content checked. Optional contact form visibly stays disabled without required configuration.
- Server contact validation, provider failure, accepted-provider response, hostname mismatch and rate-limit behaviour tested using mocks.

## Configuration-dependent checks still outstanding

- Real mail delivery to the owner's inbox: requires verified sender, destination and provider credentials.
- Live seller checkout/purchase links: requires actual product URLs. No purchases were made.
- Public search indexing/custom domain: current site remains private; no custom domain was supplied.
- Docker image build and deployment to a second hosting provider: adapters/guides supplied; no second-host account or Docker daemon used.
- Final legal/publisher review and replacement of typographic website covers with final approved artwork if desired.

Responsive iframe checks are browser layout/interaction tests, not physical-device testing. No claim of a full accessibility audit or complete cross-browser/device certification is made.
