# Security and contact delivery

## Local administration

The studio binds **127.0.0.1 only**. A cryptographically random, temporary 256-bit session token is printed in its local terminal and passed in the URL fragment, then removed from the address bar. The browser uses an Authorization header; session storage holds the token for the life of that session. Restarting the editor invalidates it.

Every content API request requires the token. Host/origin checks protect against DNS rebinding and cross-origin writes. Only same-origin POSTs mutate content. Uploads are limited to 5 MiB PNG/JPEG/WebP signatures and stored under random filenames. Arbitrary SVG/HTML uploads are rejected. Save operations validate types, IDs, references and URLs, and roll back the record if the build fails. These protections complement a trusted local computer; they do not protect against malware or malicious browser extensions. Do not share the editor URL, expose a tunnel or run it on a shared untrusted machine.

No editor UI, content APIs, draft record data or source-code archive is included in the deployed Worker. `/editor/` returns 404. Public output contains published records and their referenced assets only. Covers referenced only by drafts are excluded. The local editor is deliberately independent of a hosted identity service and works after migration. No public admin login or remote publishing dashboard is claimed.

## Enable real contact delivery

The initial form remains visibly disabled because no destination, verified sender or service credentials were supplied. No real email was sent during testing.

1. Create or use **your own Resend account**. Verify a sending domain and choose the verified `CONTACT_FROM_EMAIL` address.
2. Choose the actual recipient `CONTACT_TO_EMAIL`.
3. Create a production **Cloudflare Turnstile** widget for your actual site hostname. Keep the site key public and the secret server-side. Restrict allowed hostnames.
4. Configure these runtime variables on your host:

| Variable | Exposure |
| --- | --- |
| `PUBLIC_SITE_URL` | Public canonical HTTPS origin; exact form-origin check |
| `PUBLIC_TURNSTILE_SITE_KEY` | Public site key, intentionally returned to the browser |
| `TURNSTILE_SECRET_KEY` | Server-side secret |
| `RESEND_API_KEY` | Server-side secret |
| `CONTACT_FROM_EMAIL` | Verified sender; server-side setting |
| `CONTACT_TO_EMAIL` | Recipient; server-side setting |

5. On Node, create a private `.env` from `.env.example` or use host environment settings. On Sites/Workers, use protected runtime variables/secrets. Redeploy/restart after changes.
6. In site settings, add the public contact email/WhatsApp details you want displayed. These are separate from the inbox routing settings.
7. Complete the privacy policy's contact and retention disclosures. Review actual providers and applicable requirements before public launch.
8. Submit a genuine test from the contact page, complete the challenge yourself and confirm receipt in the configured inbox. Verify error handling using invalid fields. Do not consider contact delivery live until this test passes.

The backend validates input and size, honeypot, origin, Turnstile verification, hostname and action. Turnstile single-use/expiry checks happen at its server. It sends plain-text mail using the visitor email only as Reply-To. The success message means the provider accepted the email; it does not guarantee inbox delivery. Provider errors and timeouts return errors, never a successful receipt.

The built-in rate limit allows five validated-shape attempts per address per ten minutes, in memory. Addresses are hashed before storing the temporary counter. This is **per process/isolate**, not a global distributed quota. Configure your host's edge rate-limiting rule on `/api/contact` before a high-traffic public launch. Behind a Node reverse proxy, the default socket address may group clients; use a trusted proxy-aware adapter if per-client limits are needed. Do not trust arbitrary forwarded IP headers from the public internet.

Contact uses no website database and does not store messages in content files. Messages live in your configured inbox/provider logs. Choose a retention policy and account access controls. Do not log form bodies or credentials. If a mail provider is changed, replace only the adapter and update disclosures; books and series do not change.

## Public responses

The server sets Content Security Policy, nosniff, frame denial, restricted browser permissions and a referrer policy. Runtime secrets are not embedded during builds. HTTPS is the host's responsibility. Use host access protection for private staging after migration. Static output alone does not have the contact backend and must not pretend otherwise.

Paid delivery is external. Never put paid manuscripts, API keys, customer information or secret backups into `public/`.

## Official implementation references

- Node environment-file loading: https://nodejs.org/api/cli.html#--env-filefile
- Turnstile setup: https://developers.cloudflare.com/turnstile/get-started/
- Mandatory server verification, hostname/action and single-use tokens: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Resend email API: https://resend.com/docs/api-reference/emails/send-email
