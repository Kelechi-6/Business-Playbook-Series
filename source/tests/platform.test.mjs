import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { build, root } from "../scripts/build.mjs";
import { check } from "../scripts/check.mjs";
import { contact } from "../src/contact.mjs";
import { loadContent, validateRecord } from "../src/content.mjs";
async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "playbooks-test-"));
  for (const part of [
    "src",
    "scripts",
    "editor",
    "public",
    "content",
    ".openai",
  ])
    await fs.cp(path.join(root, part), path.join(dir, part), {
      recursive: true,
    });
  await fs.copyFile(
    path.join(root, "package.json"),
    path.join(dir, "package.json"),
  );
  return dir;
}
const add = (b, overrides = {}) => ({
  ...structuredClone(b),
  id: "qa-fixture-book",
  slug: "qa-fixture-book",
  title: "QA fixture book",
  seoTitle: "QA fixture book",
  metaDescription: "A test record used only in an isolated test directory.",
  seriesNumber: 3,
  featured: false,
  newRelease: true,
  ...overrides,
});
test("new records create book, catalogue, category, series, search and sitemap entries without application edits; drafts stay private", async () => {
  const dir = await fixture();
  try {
    const d = await loadContent(path.join(dir, "content")),
      book = add(d.books[0], { categories: ["QA fixture category"] });
    await fs.writeFile(
      path.join(dir, "content/books", book.id + ".json"),
      JSON.stringify(book),
    );
    const result = await build({ projectRoot: dir });
    assert.equal(result.books, 3);
    const get = (p) => fs.readFile(path.join(dir, "dist/site", p), "utf8");
    assert.match(
      await get("playbooks/qa-fixture-book/index.html"),
      /QA fixture book/,
    );
    assert.match(await get("playbooks/index.html"), /QA fixture category/);
    assert.match(
      await get("series/business-playbooks/index.html"),
      /QA fixture book/,
    );
    assert.match(await get("search-index.json"), /QA fixture book/);
    assert.match(await get("sitemap.xml"), /qa-fixture-book/);
    await check(path.join(dir, "dist/site"));
    book.status = "draft";
    book.title = "DRAFT_SECRET_MARKER";
    await fs.writeFile(
      path.join(dir, "content/books", book.id + ".json"),
      JSON.stringify(book),
    );
    await build({ projectRoot: dir });
    await assert.rejects(() => get("playbooks/qa-fixture-book/index.html"));
    assert.doesNotMatch(await get("search-index.json"), /DRAFT_SECRET_MARKER/);
    const worker = (
      await import(
        "file://" + path.join(dir, "dist/server/index.js") + "?draft"
      )
    ).default;
    const r = await worker.fetch(
      new Request("https://example.test/playbooks/qa-fixture-book/"),
    );
    assert.equal(r.status, 404);
    const idx = await worker.fetch(
      new Request("https://example.test/search-index.json"),
    );
    assert.doesNotMatch(await idx.text(), /DRAFT_SECRET_MARKER/);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("editing a book preserves another book’s own details while refreshing related cards; invalid data fails safely", async () => {
  const dir = await fixture();
  try {
    await build({ projectRoot: dir });
    const file = path.join(
        dir,
        "dist/site/playbooks/the-missed-revenue-playbook/index.html",
      ),
      before = await fs.readFile(file, "utf8");
    const d = await loadContent(path.join(dir, "content"));
    const b = d.books.find((x) => x.id === "customer-friction");
    b.shortDescription = "A revised test description.";
    await fs.writeFile(
      path.join(dir, "content/books", b.id + ".json"),
      JSON.stringify(b),
    );
    await build({ projectRoot: dir });
    const after = await fs.readFile(file, "utf8");
    const ownPage = (s) =>
      s.split(
        '<section class="section"><div class="section-heading"><h2>Continue exploring.',
      )[0];
    assert.equal(ownPage(after), ownPage(before));
    assert.match(after, /A revised test description/);
    b.purchaseUrl = "javascript:alert(1)";
    assert.throws(() => validateRecord("books", b));
    b.purchaseUrl = "";
    b.seriesId = "unknown-series";
    await fs.writeFile(
      path.join(dir, "content/books", b.id + ".json"),
      JSON.stringify(b),
    );
    await assert.rejects(() => build({ projectRoot: dir }), /unknown seriesId/);
    assert.equal(await fs.readFile(file, "utf8"), after);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("worker routes, real resource delivery, 404s, methods, canonical redirects and security headers", async () => {
  await build();
  const worker = (await import("../dist/server/index.js?test")).default;
  for (const p of [
    "/",
    "/playbooks/",
    "/series/",
    "/series/business-playbooks/",
    "/playbooks/the-customer-friction-playbook/",
    "/about/",
    "/resources/",
    "/contact/",
    "/privacy/",
    "/terms/",
    "/search/",
    "/sitemap.xml",
    "/robots.txt",
    "/assets/business-reflection.txt",
  ]) {
    const r = await worker.fetch(new Request("https://example.test" + p));
    assert.equal(r.status, 200, p);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  }
  const asset = await worker.fetch(
    new Request("https://example.test/assets/business-reflection.txt"),
  );
  assert.match(await asset.text(), /BUSINESS REFLECTION WORKSHEET/);
  assert.equal(
    (await worker.fetch(new Request("https://example.test/no-such-page/")))
      .status,
    404,
  );
  assert.equal(
    (await worker.fetch(new Request("https://example.test/editor/"))).status,
    404,
  );
  assert.equal(
    (await worker.fetch(new Request("https://example.test/playbooks"))).status,
    308,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://example.test/", { method: "POST" }),
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://example.test/", { method: "HEAD" }),
      )
    ).body,
    null,
  );
  const c = await worker.fetch(
    new Request("https://example.test/api/contact-config"),
  );
  assert.equal((await c.json()).enabled, false);
  const r = await check();
  assert.ok(r.internalLinks > 100);
});
const env = {
  PUBLIC_SITE_URL: "https://example.test",
  RESEND_API_KEY: "test-only",
  CONTACT_TO_EMAIL: "to@example.test",
  CONTACT_FROM_EMAIL: "from@example.test",
  TURNSTILE_SECRET_KEY: "test-only",
  PUBLIC_TURNSTILE_SITE_KEY: "test-only",
};
const req = (body, origin = "https://example.test") =>
  new Request("https://example.test/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const valid = {
  name: "QA visitor",
  email: "qa@example.test",
  message: "A test enquiry with more than twenty characters.",
  token: "test-token",
  website: "",
};
test("contact rejects unconfigured, cross-origin, invalid and spam messages; does not claim success on provider failure", async () => {
  assert.equal((await contact(req(valid), {})).status, 503);
  assert.equal(
    (await contact(req(valid, "https://attacker.test"), env)).status,
    403,
  );
  assert.equal(
    (await contact(req({ ...valid, email: "bad" }), env)).status,
    400,
  );
  assert.equal(
    (await contact(req({ ...valid, website: "spam" }), env)).status,
    400,
  );
  assert.equal(
    (await contact(req({ ...valid, message: "a".repeat(20000) }), env)).status,
    413,
  );
  const failed = await contact(req(valid), env, async () =>
    Response.json({ success: false }),
  );
  assert.equal(failed.status, 400);
  let calls = 0;
  const mailFailure = await contact(req(valid), env, async () =>
    ++calls === 1
      ? Response.json({
          success: true,
          hostname: "example.test",
          action: "contact",
        })
      : new Response("failed", { status: 500 }),
  );
  assert.equal(mailFailure.status, 502);
  calls = 0;
  const accepted = await contact(req(valid), env, async () =>
    ++calls === 1
      ? Response.json({
          success: true,
          hostname: "example.test",
          action: "contact",
        })
      : Response.json({ id: "mock-receipt" }),
  );
  assert.equal(accepted.status, 200);
  assert.match((await accepted.json()).message, /accepted by the mail service/);
});
test("local editor enforces authentication and origin; adds and edits a real record, rebuilds and exports portable JSON", async () => {
  const dir = await fixture(),
    port = 45000 + Math.floor(Math.random() * 10000);
  const child = spawn(process.execPath, ["scripts/editor.mjs"], {
    cwd: dir,
    env: { ...process.env, EDITOR_PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    let output = "";
    const token = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(Error("Editor did not start")),
        10000,
      );
      child.stdout.on("data", (chunk) => {
        output += chunk;
        const m = output.match(/\/#([a-f0-9]{64})/);
        if (m) {
          clearTimeout(timeout);
          resolve(m[1]);
        }
      });
      child.once("error", reject);
    });
    const url = `http://127.0.0.1:${port}`,
      headers = {
        Authorization: "Bearer " + token,
        Origin: url,
        "Content-Type": "application/json",
      };
    assert.equal((await fetch(url + "/api/content")).status, 401);
    assert.equal(
      (
        await fetch(url + "/api/content", {
          headers: { ...headers, Origin: "https://attacker.test" },
        })
      ).status,
      403,
    );
    const d = await (await fetch(url + "/api/content", { headers })).json();
    const book = add(d.books[0]);
    let response = await fetch(url + "/api/save", {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "books", record: book, originalId: null }),
    });
    assert.equal(response.status, 200, await response.text());
    assert.match(
      await fs.readFile(
        path.join(dir, "dist/site/playbooks/qa-fixture-book/index.html"),
        "utf8",
      ),
      /QA fixture book/,
    );
    book.title = "Edited fixture title";
    response = await fetch(url + "/api/save", {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "books",
        record: book,
        originalId: book.id,
      }),
    });
    assert.equal(response.status, 200);
    const backup = await (await fetch(url + "/api/export", { headers })).json();
    assert.equal(
      backup.books.find((x) => x.id === book.id).title,
      "Edited fixture title",
    );
    assert.ok(backup.site && backup.legal && backup.series && backup.resources);
    const bad = await fetch(url + "/api/upload", {
      method: "POST",
      headers,
      body: JSON.stringify({
        base64: Buffer.from("<script>bad</script>").toString("base64"),
      }),
    });
    assert.equal(bad.status, 400);
    response = await fetch(url + "/api/upload", {
      method: "POST",
      headers,
      body: JSON.stringify({
        base64:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jArUAAAAASUVORK5CYII=",
      }),
    });
    assert.equal(response.status, 200);
    assert.match((await response.json()).url, /^\/assets\/cover-.*\.png$/);
  } finally {
    child.kill();
    await once(child, "exit").catch(() => {});
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("rate limiter rejects a sixth attempt and hostname/action mismatches never deliver mail", async () => {
  let sent = 0;
  const fake = async () => {
    sent++;
    return Response.json({ success: false });
  };
  for (let i = 0; i < 5; i++) {
    const r = req(valid);
    r.headers.set("x-runtime-client-ip", "qa-rate-only");
    assert.equal((await contact(r, env, fake)).status, 400);
  }
  const sixth = req(valid);
  sixth.headers.set("x-runtime-client-ip", "qa-rate-only");
  assert.equal((await contact(sixth, env, fake)).status, 429);
  assert.equal(sent, 5);
  const mismatch = req(valid);
  mismatch.headers.set("x-runtime-client-ip", "qa-host-only");
  assert.equal(
    (
      await contact(mismatch, env, async () =>
        Response.json({
          success: true,
          hostname: "attacker.test",
          action: "contact",
        }),
      )
    ).status,
    400,
  );
});
test("source export includes editor, content, guides and environment example, excludes secrets, and rebuilds independently; JSON import works", async () => {
  const dir = await fixture();
  try {
    for (const name of ["README.md", "package-lock.json", ".env.example"])
      await fs.copyFile(path.join(root, name), path.join(dir, name));
    await fs.cp(path.join(root, "docs"), path.join(dir, "docs"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(dir, ".env"),
      "QA_SECRET_MUST_NOT_EXPORT=secret",
    );
    await fs.writeFile(
      path.join(dir, ".env.custom"),
      "QA_SECRET_MUST_NOT_EXPORT=secret",
    );
    const { execFileSync } = await import("node:child_process");
    execFileSync(process.execPath, ["scripts/export.mjs"], { cwd: dir });
    const archive = path.join(dir, "exports/business-playbooks-source.tar.gz");
    const listing = execFileSync("tar", ["-tzf", archive], {
      encoding: "utf8",
    });
    assert.match(listing, /\.env\.example/);
    assert.match(listing, /editor\/index.html/);
    assert.doesNotMatch(listing, /\.\/\.env\n|\.env.custom/);
    const restored = path.join(dir, "restored");
    await fs.mkdir(restored);
    execFileSync("tar", ["-xzf", archive, "-C", restored]);
    await build({ projectRoot: restored });
    await check(path.join(restored, "dist/site"));
    const backup = JSON.parse(
      await fs.readFile(path.join(dir, "exports/content-backup.json"), "utf8"),
    );
    backup.books[0].title = "Restored content title";
    const input = path.join(dir, "restore-test.json");
    await fs.writeFile(input, JSON.stringify(backup));
    execFileSync(process.execPath, ["scripts/import-content.mjs", input], {
      cwd: restored,
    });
    const imported = await loadContent(path.join(restored, "content"));
    assert.equal(imported.books[0].title, "Restored content title");
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("new series and future products render through shared templates; optional links, contents and prices follow content", async () => {
  const dir = await fixture();
  try {
    const d = await loadContent(path.join(dir, "content"));
    const series = {
      id: "qa-new-series",
      slug: "qa-new-series",
      name: "QA new series",
      description: "An isolated test collection.",
      readingOrder: ["qa-fixture-book"],
      status: "published",
      seoTitle: "QA series title",
      metaDescription: "An isolated collection for automated testing.",
    };
    const b = add(d.books[0], {
      seriesId: series.id,
      productType: "workbook",
      price: 9.5,
      currency: "USD",
      purchaseUrl: "https://checkout.example.test/test-product",
      sampleUrl: "/assets/business-reflection.txt",
      tableOfContents: ["Chapter one: test heading"],
      contributors: ["QA contributor"],
    });
    await fs.writeFile(
      path.join(dir, "content/series", series.id + ".json"),
      JSON.stringify(series),
    );
    await fs.writeFile(
      path.join(dir, "content/books", b.id + ".json"),
      JSON.stringify(b),
    );
    await build({ projectRoot: dir });
    const read = (p) => fs.readFile(path.join(dir, "dist/site", p), "utf8");
    assert.match(await read("series/index.html"), /QA new series/);
    assert.match(
      await read("series/qa-new-series/index.html"),
      /QA fixture book/,
    );
    const html = await read("playbooks/qa-fixture-book/index.html");
    assert.match(html, /Buy this workbook/);
    assert.match(html, /https:\/\/checkout.example.test\/test-product/);
    assert.match(html, /Chapter one: test heading/);
    assert.match(html, /QA contributor/);
    assert.match(html, /\$9.50/);
    await check(path.join(dir, "dist/site"));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("unpublished cover artwork and unreferenced files never enter public output", async () => {
  const dir = await fixture();
  try {
    const d = await loadContent(path.join(dir, "content"));
    const draft = add(d.books[0], {
      status: "draft",
      cover: "/assets/private-draft-cover.svg",
    });
    await fs.writeFile(
      path.join(dir, "public/assets/private-draft-cover.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg"><text>PRIVATE_COVER_MARKER</text></svg>',
    );
    await fs.writeFile(
      path.join(dir, "content/books", draft.id + ".json"),
      JSON.stringify(draft),
    );
    await build({ projectRoot: dir });
    await assert.rejects(() =>
      fs.access(path.join(dir, "dist/site/assets/private-draft-cover.svg")),
    );
    const worker = (
      await import(
        "file://" + path.join(dir, "dist/server/index.js") + "?cover"
      )
    ).default;
    assert.equal(
      (
        await worker.fetch(
          new Request("https://example.test/assets/private-draft-cover.svg"),
        )
      ).status,
      404,
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("portable Node production adapter serves the platform and never exposes editor or development review routes", async () => {
  const dir = await fixture();
  let child;
  try {
    await build({ projectRoot: dir });
    const port = 56000 + Math.floor(Math.random() * 5000);
    child = spawn(process.execPath, ["scripts/serve.mjs", "--production"], {
      cwd: dir,
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("Production Node adapter did not start")),
        10000,
      );
      child.stdout.on("data", (s) => {
        if (s.toString().includes("Website running")) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.once("error", reject);
    });
    const url = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(url + "/playbooks/")).status, 200);
    assert.equal((await fetch(url + "/editor/")).status, 404);
    assert.equal((await fetch(url + "/__review/")).status, 404);
    assert.equal((await fetch(url + "/__review/frame/")).status, 404);
    assert.equal(
      (await (await fetch(url + "/api/contact-config")).json()).enabled,
      false,
    );
  } finally {
    if (child) {
      child.kill();
      await once(child, "exit").catch(() => {});
    }
    await fs.rm(dir, { recursive: true, force: true });
  }
});
