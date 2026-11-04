# Export, backup, restore and host migration

## No database to migrate

Books, series, articles and settings are the data store, represented as independent JSON files. Covers and free resources are ordinary assets. No SQL, hosted database, CMS subscription or platform-specific content API is required. The full schema is documented in CONTENT-GUIDE.md and enforced by `src/content.mjs`.

## Full backup

Run `npm run export` from the project folder. It creates:

- `exports/business-playbooks-source.tar.gz`: application source, content, covers, editor, tests and documentation.
- `exports/content-backup.json`: an aggregate content export, including drafts.

The source archive excludes `.env` and `.env.*` except `.env.example`, Git internals, dependencies, generated output, exports and backups. The non-secret `.env.example` is retained. No secret files are included. Keep real environment values in your own password manager or secret store. Save both exports in a private backup location. Content backups include drafts and must not be uploaded to the public website.

For a full source snapshot you can also zip the project folder using your operating system, excluding secrets, `.git`, `dist/`, `node_modules/`, `exports/` and `backups/`. Verify the archive contents before sharing it.

## Restore on another computer

1. Extract the full source archive to a new folder.
2. Install Node.js 24, run `npm ci` and `npm run build`.
3. Restore any real runtime secret variables from your protected store; never from a public archive.
4. Run `npm test`, `npm run check` and `npm run dev`.
5. Open the editor with `npm run edit` if changes are needed.

A source export contains `content/` and `public/assets/`, so no content import is necessary for that route.

## Import only a JSON content export

Copy all corresponding cover/resource files into `public/assets/` first, then run:

```
node scripts/import-content.mjs /absolute/path/to/content-backup.json
```

The importer validates records/references, writes a private timestamped backup under `backups/`, replaces content and rebuilds. Missing assets or invalid content cause rollback to the prior content. The aggregate JSON has `site`, `legal`, `books`, `series`, `resources` keys. The import does not contain binary images. A content-only export cannot replace an asset backup.

## Move to another host

1. Download/export the source; keep a private copy independent of Sites.
2. Initialise your own Git repository using README instructions, or push to a repository you already own.
3. Choose Node/Docker, Worker or static hosting using DEPLOYMENT.md.
4. Update the canonical origin in site settings or `PUBLIC_SITE_URL`; rebuild the site.
5. Recreate contact variables/secrets in the new host. The content platform needs no database migration.
6. If retaining a custom domain, move its DNS only after verifying the new deployment.
7. Preserve URL slugs. For changed slugs, add permanent redirects on the new host.
8. Update Turnstile's allowed hostname and mail sender configuration if necessary.
9. Test contact using a real inbox, external purchases, downloads and sitemap.
10. Keep the old deployment until verification is complete; then retire it in your own account.

The generated Node/static/Worker code does not use the Sites SDK. `.openai/hosting.json` is only the current hosting identifier and can be ignored on another host. ChatGPT's private access gate does not migrate automatically: use your new host's access protection for private staging, or explicitly launch publicly when ready.

## Maintenance schedule

Back up after every content release. Commit source/content changes in Git. Monthly, review Node support/security updates and checkout links. After changing services, update the privacy policy. Periodically test a full restore into a new folder. Review large images and catalogue growth before host limits become a problem.
