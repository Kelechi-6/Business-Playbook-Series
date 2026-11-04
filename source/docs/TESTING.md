# Verification checklist

## Automated checks

Run `npm test`, `npm run build`, `npm run check`.

The test suite:

- Adds a published third book as a content record and verifies its detail page, catalogue/category, series, search and sitemap entries.
- Makes it a draft and checks its generated route is absent/404 and private text is excluded from search.
- Edits one book and verifies another book's own details stay intact while its related-book card refreshes correctly.
- Rejects unsafe URLs and invalid series references, preserving the last valid build.
- Checks standard routes, security headers, clean-URL redirects, 404s and method restrictions.
- Verifies that the free worksheet actually contains downloadable content.
- Checks contact disabled-state, cross-origin rejection, invalid input, spam failure, provider error and accepted-provider response using isolated mocks.
- Starts the actual local editor in a temporary copy; verifies authentication/origin protection, adds and edits a record, rebuilds, exports content and checks cover-upload restrictions.
- Crawls generated HTML for local broken links and missing page titles/descriptions.

Mocks do not establish live mail delivery. Tests do not make purchases, charge cards, invent sales links or put fixture books on the published website.

## Browser acceptance checklist

- [ ] Desktop: homepage, catalogue cards and detail layouts display without clipping.
- [ ] Mobile: menu opens/closes and is keyboard usable; no horizontal overflow.
- [ ] Catalogue: search, category, series and sort work; filters are shareable in the URL.
- [ ] Empty state: impossible query shows a useful reset option.
- [ ] Site search finds both books and resources.
- [ ] Series index and recommended reading links reach the right books.
- [ ] Resource download returns the intended file.
- [ ] Contact clearly shows unavailable state before configuration.
- [ ] Contact sends to the configured real inbox after service setup.
- [ ] Purchase links open the intended seller/product after real URLs are entered.
- [ ] All forms have visible labels and keyboard focus; reduced-motion preferences are respected.
- [ ] Private site is inaccessible to unauthorised visitors.
- [ ] Source export extracts and rebuilds independently.
- [ ] A new record can be added from the local editor without changing application code.
- [ ] Custom-domain canonical tags, robots and sitemap match after migration.

See VERIFICATION-RESULTS.md for checks actually completed. Do not interpret unchecked future configuration items as passed tests.
