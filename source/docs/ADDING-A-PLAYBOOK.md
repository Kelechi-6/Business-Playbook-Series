# Add your next playbook without changing application code

1. Extract the project, install Node.js 24 and run `npm ci` in the project folder.
2. Run `npm run dev` for the website preview. In another terminal run `npm run edit`.
3. Open the exact private editor URL printed in that terminal: `http://127.0.0.1:4310/#…`. Do not share its session token.
4. Choose **Playbooks & products**, then **Add new record**.
5. Give it a unique **ID**, such as `your-next-playbook`. Use lowercase words and hyphens. Keep IDs stable. The filename will be `content/books/your-next-playbook.json`.
6. Give it a unique **URL slug** such as `the-next-playbook`. The generated address will be `/playbooks/the-next-playbook/`.
7. Enter title, subtitle, author, summary and descriptions. List items and paragraphs go on separate lines. Complete audience, takeaways, categories, keywords, edition and SEO fields.
8. Choose the series and its number. For a new collection, first select **Series**, add its record and save. Publish the series before publishing a book within it.
9. Use **Upload or replace cover** for a PNG/JPEG/WebP up to 5 MiB, ideally portrait 2:3. Write a meaningful cover description. The image is saved as a standard asset.
10. Leave unconfirmed prices and dates blank. Add a real checkout URL when available. Download URLs are for free resources only; files in `public/` are publicly accessible on a public site.
11. Save as **draft** while preparing. Drafts are excluded from all public output. A valid save validates references and rebuilds automatically.
12. Set status to **published** and save. A detail page, catalogue entry, category option, series placement, search entry and sitemap URL are generated automatically. You do not create a route file or edit application code.
13. Set **New release** for the homepage latest releases section. To control the featured section, edit **Homepage, author & contact** and add the book's ID to **Homepage featured book IDs**. If that list is empty, published records with **Featured** enabled are selected.
14. For a specific reading sequence, edit the series and add book IDs to **Recommended reading order**, one per line. Unlisted books follow by their series number.
15. Reload your local website preview and check the generated page, catalogue, filters, search, reading order and links.
16. Run `npm test`, `npm run build`, `npm run check`. Deploy using DEPLOYMENT.md.
17. Commit the content/cover changes to your own Git repository and run `npm run export` for backup.

## File-editing alternative

Copy an existing book JSON record, rename it to its new `id.json`, update its ID/slug and fields, and put its cover in `public/assets/`. This is content editing only: no changes to `src/`, templates or routing are necessary. Use double quotes, valid JSON arrays and `null` for an unknown price. Run the build to catch errors.

## Demonstration performed

Tests add a third **QA fixture book** through the actual editor API in a temporary project, publish it, verify generated pages/search/category/series/sitemap entries, edit its title and export the updated content. Draft tests confirm an unpublished record has no public page or search entry. Test fixtures never enter the live content and are removed with their temporary folders.
