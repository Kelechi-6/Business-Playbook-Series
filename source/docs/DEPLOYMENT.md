# Deployment and custom domain

No alternative host or custom domain was named. The existing deployment remains on Sites and stays private. The independent default is a standard Node.js/Docker host; the same project also builds static output and a Worker adapter.

| Hosting choice | Output/start command | Contact form |
| --- | --- | --- |
| Sites | Generated `dist/server/index.js` via current Site workflow | Configure runtime mail and Turnstile variables |
| Node 22+/24 host | Build project, then `npm start` | Same server-side contact handler |
| Docker host/VPS | Included Dockerfile; container port 3000 | Runtime variables/secrets |
| Cloudflare Workers | Generated Worker and `wrangler.toml` | Variables/secrets in your account |
| Any static host | Publish `dist/site/` | Requires compatible API proxy; otherwise disabled |

## Standard build

1. Set `content/site.json.url` to the final HTTPS origin or supply `PUBLIC_SITE_URL` during build.
2. Run `npm ci`, `npm test`, `npm run build`, `npm run check`.
3. Deploy the chosen output. Set the same `PUBLIC_SITE_URL` at runtime for contact origin validation.
4. Configure the optional contact services using SECURITY-AND-CONTACT.md.
5. Verify your public domain, canonical tags, sitemap and every configured checkout URL.

## Node hosting

Use Node 24 (22+ compatible). Build command: `npm ci && npm run build && npm run check`. Start command: `npm start`. Set `PORT` according to the host. The Node server binds `0.0.0.0`; put the host's managed HTTPS/reverse proxy in front of it. Supply secrets through protected runtime settings. Editing takes place locally, followed by rebuild/redeployment. Do not expose the local content studio on a server.

## Docker / VPS

```
docker build --build-arg PUBLIC_SITE_URL=https://YOUR-DOMAIN -t business-playbooks .
docker run -d --name business-playbooks --restart unless-stopped \
  --env-file .env -p 127.0.0.1:3000:3000 business-playbooks
```

Create `.env` from `.env.example` using your own values. Put a reverse proxy with HTTPS in front of local port 3000. Keep it private to the proxy. On a managed container host, configure its environment settings and container port according to that provider's current instructions. Docker configuration is supplied but an actual image build/deployment was not tested in this environment.

## Independent Cloudflare Worker

Install the official Wrangler CLI using https://developers.cloudflare.com/workers/wrangler/install-and-update/ and authenticate with your own account. Build with the final origin, configure the included `wrangler.toml`, set protected runtime secrets and run `wrangler deploy`. Add a custom domain in your own account. Check the selected plan's current size limits: the self-contained Worker embeds published assets. Larger libraries can use the Node/static adapter or an extended asset-storage adapter.

## Static hosting

Upload `dist/site/` as the published directory. Directory indexes provide clean URLs. Configure missing pages to return `404.html` with HTTP 404; do not rewrite every URL to the homepage. Catalogue, series, resources and search work without a server. Contact delivery stays unavailable unless `/api/contact-config` and `/api/contact` are served by a compatible server-side endpoint. Never turn on form controls without a working delivery adapter.

## Custom domain and migration

Keep your registrar, billing and DNS under your own control. Add the domain at your selected host, copy that host's returned DNS records to your registrar and wait for verification/TLS. Change the canonical origin in content or build environment, rebuild and redeploy. Update runtime `PUBLIC_SITE_URL` and Turnstile's hostname allowlist. Redirect alternate domains to the canonical origin. Domain/DNS changes and an alternative paid hosting account were not performed here.

Public indexing cannot be verified while the current site remains private. See MIGRATION.md for portable backup and restore. Roll back by restoring the previous Git commit/build and deploying it or using your host's version history.
