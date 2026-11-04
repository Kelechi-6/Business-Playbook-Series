# Content schema and editing

All content is separate from presentation. The local editor writes JSON records; reusable templates in `src/templates.mjs` generate pages. Text is escaped; arbitrary HTML/script embeds are not accepted. Arrays contain paragraphs or list items, entered one per line in the studio.

## Books: `content/books/{id}.json`

| Fields | Type and role |
| --- | --- |
| `id`, `slug` | Unique lowercase hyphenated text; filename matches ID; slug generates detail URL |
| `title`, `subtitle` | Detail heading and subtitle |
| `seriesId`, `seriesNumber` | Existing series ID and positive integer for placement |
| `cover`, `coverAlt` | Local `/assets/` image path and accessible description |
| `shortDescription`, `description` | Summary text and array of long-description paragraphs |
| `author`, `contributors` | Author text and contributor array |
| `publicationDate`, `edition` | Confirmed YYYY-MM-DD or empty; edition text |
| `categories`, `tags`, `keywords` | Arrays used for catalogue organisation and search |
| `audience`, `takeaways` | Detail-page lists |
| `tableOfContents`, `sampleUrl` | Optional chapter-heading array and preview link |
| `price`, `currency` | Non-negative number or null; three-letter currency code |
| `purchaseUrl`, `downloadUrl` | Optional secure external checkout / free resource links |
| `productType` | book, bundle, course, template or workbook |
| `featured`, `newRelease`, `status` | Booleans; status is draft or published |
| `availability` | Honest message when no sales link is configured |
| `seoTitle`, `metaDescription` | Page-specific SEO fields |

No invented ISBN, award, review or sales claim is generated. Contributor names are retained in the record. Purchase prices are informational; external sellers control transactions. Future product types use the reusable detail page, without payment processing or protected delivery being implied.

## Series: `content/series/{id}.json`

`id`, `slug`, `name`, `description`, `readingOrder` (book IDs), `status`, `seoTitle`, `metaDescription`. New published records automatically appear in the series index and get their own page. Books are grouped by `seriesId`. The explicit reading list is followed by remaining series books ordered by number. Draft books are excluded even if referenced by the list.

## Resources: `content/resources/{id}.json`

`id`, `slug`, `title`, `summary`, `type`, `author`, `date`, `categories`, `tags`, `body` (paragraph array), `relatedBooks` (IDs), optional `downloadUrl`, `status`, `seoTitle`, `metaDescription`. Published records automatically appear in resources and site search. Only supplied related books are linked.

## Homepage and global content

`content/site.json` stores name, author, URL, tagline, hero copy, author biography, mission, philosophy, homepage book IDs, social sharing image and public email/WhatsApp details. Keep unknown contact details empty. `homeFeatured` specifies IDs and order; otherwise the featured flag is used. The latest releases section appears only when published books are explicitly marked as new.

Categories are derived from published book records. Add a new category label to create a catalogue filter option and homepage category link. No route code is needed. Categories use shareable filtered catalogue URLs rather than separate duplicated page templates.

## Privacy and terms

`content/legal.json` contains nested sections. The studio exposes a JSON editor for these pages. Edit values while preserving keys and punctuation. Update publisher contact information, retention periods and applicable disclosures and arrange appropriate review before public launch.

## Validation and URLs

Build checks include unique IDs/slugs, required fields, URL safety, series/related-book references, publication constraints, cover presence and local resource files. Failed builds preserve the last completed output. Editor saves restore the previous content record if rebuilding fails.

Keep IDs unchanged. Changing a slug changes a public URL; preserve existing slugs or add permanent redirects on your chosen host. Back up changes in Git.

## Capacity

There is no application-level record quota. Content is rebuilt as a whole and search loads the published index in the browser. Large libraries will eventually need pagination, incremental builds and server-indexed search. The self-contained Worker embeds assets and is subject to host upload limits. Node/static hosting uses ordinary files and is easier to expand for large image libraries. Capacity depends on hosting and storage, not a promise of unlimited resources.

Only assets referenced by published content or the shared templates are copied into the public build. An uploaded cover used only by a draft is excluded until publication. Source exports retain all original assets for backup. To publish an additional free file, reference it from a published book/resource record.
