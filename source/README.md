# The Business Playbook Series publishing platform

A portable, data-driven publishing website for Timothy Madu. Books, series, articles and site settings live in editable content files. Shared templates generate every page. A private **local content studio** edits records and uploads covers without application-code changes.

This is a full multi-page publishing website, not a single landing page. It uses a small dependency-free Node.js static-site generator and standard ES modules rather than Next.js. Rendering happens at build time; a portable Fetch API server handles the optional contact form. There is no database, hosted CMS, proprietary content format or runtime framework dependency.

## Quick start

1. Install Node.js 24 LTS (22+ supported) from https://nodejs.org/.
2. Extract this project and open a terminal in its folder.
3. `npm ci` (the lockfile currently has no third-party dependencies).
4. `npm run dev` and open `http://localhost:3000`.
5. In another terminal, `npm run edit`. Open the **exact private URL** printed there, beginning `http://127.0.0.1:4310/#…`.
6. Add or edit records, save, then reload your website preview.
7. `npm test`, `npm run build`, `npm run check` before deployment.

The content studio runs only on your own machine, not on the deployed website. Its random session credential changes on restart. Do not expose it through a tunnel. Closing its terminal ends the editing session. The generated public site contains no editor or draft records.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build and preview, port 3000 by default |
| `npm run edit` | Secure loopback content studio, port 4310 |
| `npm run build` | Validate content and generate the multi-page site and Worker |
| `npm start` | Serve a completed build on a Node host |
| `npm test` | Content, rendering, draft, editor, route and contact tests |
| `npm run check` | Crawl generated HTML for broken internal URLs and missing titles/descriptions |
| `npm run export` | Export source archive and a complete JSON content backup |
| `node scripts/import-content.mjs /path/to/content-backup.json` | Restore a JSON content export with validation and rollback |

No installation is needed for runtime packages. `tar` is required for `npm run export` and is included with macOS/Linux and modern Windows. Source can also be zipped with your operating system. Use a currently supported Node release and review it periodically.

## Structure

```
content/site.json              Homepage, contact, author and SEO settings
content/books/*.json           One independent record per book/product
content/series/*.json          One independent record per collection
content/resources/*.json       Insights, articles and downloads
content/legal.json             Editable legal text
public/assets/                 Standard SVG, PNG, JPEG, WebP and other public resources
src/content.mjs                Validation and content loading
src/templates.mjs              Reusable page and card templates
src/contact.mjs                Portable server-side contact delivery
editor/                       Local studio UI; excluded from public output
scripts/editor.mjs             Authenticated loopback editor server
scripts/build.mjs              Deterministic content-to-page generation
scripts/serve.mjs              Standard Node hosting adapter
scripts/check.mjs              Internal-link verification
scripts/export.mjs             Portable export
scripts/import-content.mjs     Validated import with rollback
tests/                        Isolated content and integration tests
dist/site/                    Generated static pages and assets
dist/server/index.js          Self-contained Fetch API Worker
```

## Start here

- [Add the next playbook](docs/ADDING-A-PLAYBOOK.md)
- [Editing and content fields](docs/CONTENT-GUIDE.md)
- [Deploy and connect a domain](docs/DEPLOYMENT.md)
- [Export, migration and backups](docs/MIGRATION.md)
- [Security and contact setup](docs/SECURITY-AND-CONTACT.md)
- [Testing checklist and results](docs/TESTING.md)
- [Current configuration and launch tasks](docs/LAUNCH-STATUS.md)

## What requires configuration

The catalogue, navigation, search, local editor, resources and export work without external services. Purchase links are intentionally empty until confirmed. No transaction is simulated. Contact delivery requires your Resend account, verified sender, recipient email and Cloudflare Turnstile keys. The current deployment stays private. Canonical URLs use `content/site.json.url` or the build-time `PUBLIC_SITE_URL` override.

The legal text describes this initial implementation and marks publisher details needing review. Review it before public launch; no claim of legal compliance or complete legal review is made.

## Ownership and repository

The complete source is in the downloadable archive and the Sites source repository. The archive is independent of the hosting account. To use your own repository:

```
git init
git add .
git commit -m "Initial publishing platform"
git branch -M main
git remote add origin YOUR_OWN_GIT_REMOTE_URL
git push -u origin main
```

Do not commit `.env`, exports or private data. The Sites identity in `.openai/hosting.json` is used only by Sites; Node/Docker/static deployment does not depend on it. No GitHub account or repository has been created on your behalf.

## External dependencies

| Service | Required? | Replacement/migration |
| --- | --- | --- |
| Node.js and npm | Build/local editor; Node hosting | Standard open-source runtime, no package dependencies |
| Sites hosting and private ChatGPT access gate | Current deployment only | Deploy the same build to Node/Docker or any static host |
| Resend | Only if contact delivery enabled | Replace the small mail adapter in `src/contact.mjs` |
| Cloudflare Turnstile | Only if contact delivery enabled | Replace widget and server-side verification together |
| External checkout/sales provider | Only if purchase links configured | Edit the book's `purchaseUrl` |
| Domain/DNS provider | Optional custom domain | Keep registrar account under your control |

No database schema or SQL migration is necessary. Content schema and JSON export/import are documented. Free resources in `public/` are publicly retrievable once the site is public. Paid files must stay with a provider offering protected delivery.
