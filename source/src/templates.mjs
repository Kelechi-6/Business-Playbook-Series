export const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const E = escape;
export const bookUrl = (b) => "/playbooks/" + b.slug + "/";
export const seriesUrl = (s) => "/series/" + s.slug + "/";
export const resourceUrl = (r) => "/resources/" + r.slug + "/";
export const paras = (arr) => arr.map((x) => `<p>${E(x)}</p>`).join("");
export const bullets = (arr) =>
  `<ul class="bullet-list">${arr.map((x) => `<li>${E(x)}</li>`).join("")}</ul>`;
export function card(b, series) {
  return `<article class="book-card" data-categories="${E(b.categories.join("|"))}"><a class="cover-link" href="${bookUrl(b)}" tabindex="-1" aria-hidden="true"><img src="${E(b.cover)}" alt="" width="600" height="900" loading="lazy">${b.newRelease ? '<span class="new-badge">New release</span>' : ""}</a><div class="card-copy"><div class="eyebrow">${E(b.categories[0] || "Playbook")} <span>/ ${String(b.seriesNumber).padStart(2, "0")}</span></div><h3><a href="${bookUrl(b)}">${E(b.title)}</a></h3><p>${E(b.shortDescription)}</p><div class="card-bottom"><span>${E(series?.name || "")}</span><a class="arrow-link" href="${bookUrl(b)}" aria-label="Explore ${E(b.title)}">Explore ↗</a></div></div></article>`;
}
export function resourceCard(r) {
  return `<article class="resource-card"><div class="eyebrow">${E(r.type)}</div><h3><a href="${resourceUrl(r)}">${E(r.title)}</a></h3><p>${E(r.summary)}</p><a class="arrow-link" href="${resourceUrl(r)}">${r.downloadUrl ? "Get the resource" : "Read the insight"} ↗</a></article>`;
}
function bread(items) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a>${items.map(([label, url]) => `<span aria-hidden="true">/</span>${url ? `<a href="${url}">${E(label)}</a>` : `<span aria-current="page">${E(label)}</span>`}`).join("")}</nav>`;
}
export function layout({
  site,
  path = "/",
  title,
  description,
  body,
  structured = [],
  noindex = false,
}) {
  const canonical = new URL(path, site.url).href;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      author: { "@type": "Person", name: site.author },
    },
    ...structured,
  ];
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(title)}</title><meta name="description" content="${E(description)}"><meta name="theme-color" content="#102c3b"><link rel="canonical" href="${E(canonical)}"><meta name="robots" content="${noindex ? "noindex,follow" : "index,follow"}"><meta property="og:type" content="website"><meta property="og:title" content="${E(title)}"><meta property="og:description" content="${E(description)}"><meta property="og:url" content="${E(canonical)}"><meta property="og:image" content="${E(new URL(site.socialImage, site.url).href)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script><script src="/assets/site.js" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="header"><div class="wrap nav"><a class="brand" href="/" aria-label="Timothy Madu home"><span class="monogram">TM</span><span>Timothy Madu<small>THE BUSINESS PLAYBOOK SERIES</small></span></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="main-nav">Menu ☰</button><nav id="main-nav" aria-label="Main navigation">${[
    ["/playbooks/", "Playbooks"],
    ["/series/", "Series"],
    ["/resources/", "Resources"],
    ["/about/", "About"],
  ]
    .map(
      ([url, label]) =>
        `<a href="${url}"${path.startsWith(url) ? ' aria-current="page"' : ""}>${label}</a>`,
    )
    .join(
      "",
    )}<a class="search-icon" href="/search/" aria-label="Search books and resources">Search ⌕</a><a class="nav-contact" href="/contact/">Get in touch ↗</a></nav></div></header><main id="main">${body}</main><footer><div class="wrap footer-grid"><div><a class="brand" href="/"><span class="monogram">TM</span><span>Timothy Madu<small>THE BUSINESS PLAYBOOK SERIES</small></span></a><p>${E(site.tagline)}</p></div><div><h2>Explore</h2><a href="/playbooks/">All playbooks</a><a href="/series/">Playbook series</a><a href="/resources/">Resources & insights</a></div><div><h2>Connect</h2><a href="/about/">About Timothy</a><a href="/contact/">Contact</a><a href="/search/">Search the website</a></div></div><div class="wrap footer-base"><span>© ${new Date().getUTCFullYear()} ${E(site.author)}. All rights reserved.</span><div><a href="/privacy/">Privacy policy</a><a href="/terms/">Website terms</a></div></div></footer></body></html>`;
}
export function home(data) {
  const { site, books, series, resources } = data;
  const featured = site.homeFeatured
    .map((id) => books.find((b) => b.id === id))
    .filter(Boolean);
  const selected = featured.length
    ? featured
    : books.filter((b) => b.featured).slice(0, 4);
  const heroes = selected.slice(0, 2);
  const latest = books.filter((b) => b.newRelease);
  const categories = [...new Set(books.flatMap((b) => b.categories))];
  return `<section class="hero"><div class="wrap hero-grid"><div class="hero-copy"><div class="eyebrow light">A practical library for business improvement</div><h1>${E(site.heroTitle).replace("Stronger businesses.", "<em>Stronger businesses.</em>")}</h1><p>${E(site.heroDescription)}</p><div class="actions"><a class="button" href="/playbooks/">Find your next playbook ↗</a><a class="quiet-link" href="/about/">Meet the author →</a></div><div class="hero-foot"><span class="mini-line"></span> Written for people building better businesses.</div></div><div class="hero-books">${heroes.map((b, i) => `<a href="${bookUrl(b)}" class="hero-book book-${i}" aria-label="Explore ${E(b.title)}"><img src="${E(b.cover)}" alt="${E(b.coverAlt)}" width="600" height="900" fetchpriority="${i === 0 ? "high" : "auto"}"></a>`).join("")}<span class="orbit orbit-one"></span><span class="orbit orbit-two"></span></div></div></section><div class="topic-strip"><div class="wrap"><span>Customer experience</span><span>Revenue opportunities</span><span>Sales performance</span><span>Business operations</span></div></div><section class="wrap section"><div class="section-heading"><div><div class="eyebrow">The featured collection</div><h2>Knowledge you can<br>put to work.</h2></div><div><p>Focused books for real business questions. Choose the challenge you want to understand more clearly.</p><a class="arrow-link" href="/playbooks/">View all playbooks ↗</a></div></div><div class="book-grid">${
    selected
      .map((b) =>
        card(
          b,
          series.find((s) => s.id === b.seriesId),
        ),
      )
      .join("") || "<p>The collection is being prepared.</p>"
  }</div></section>${
    latest.length
      ? `<section class="wrap section compact"><div class="eyebrow">Latest releases</div><h2>New to the collection.</h2><div class="book-grid">${latest
          .map((b) =>
            card(
              b,
              series.find((s) => s.id === b.seriesId),
            ),
          )
          .join("")}</div></section>`
      : ""
  }<section class="browse-band"><div class="wrap"><div class="eyebrow">Choose your focus</div><h2>Start with the question<br>in front of you.</h2><div class="category-links">${categories.map((c, i) => `<a href="/playbooks/?category=${encodeURIComponent(c)}"><span>0${i + 1}</span>${E(c)}<b>↗</b></a>`).join("")}</div></div></section><section class="wrap section author-teaser"><div class="author-banner"><img src="/assets/author-banner.png" alt="Timothy Madu and the Business Playbook Series" width="2048" height="753" loading="lazy"></div><div class="author-teaser-copy"><div class="eyebrow">The author behind the playbooks</div><h2>Timothy Madu</h2><p>${E(site.authorBio)}</p><a class="arrow-link" href="/about/">Read the story & philosophy ↗</a></div></section><section class="principles"><div class="wrap"><div class="section-heading"><div><div class="eyebrow light">A considered approach</div><h2>Clarity before action.<br>Evidence before claims.</h2></div><p>Practical thinking means looking closely, asking useful questions and checking what a change achieves.</p></div><div class="principle-grid"><div><span>01 / UNDERSTAND</span><h3>See the problem clearly.</h3><p>Describe the experience or opportunity before choosing a solution.</p></div><div><span>02 / DECIDE</span><h3>Focus your effort.</h3><p>Consider evidence, feasibility, cost and the people affected.</p></div><div><span>03 / LEARN</span><h3>Check the result.</h3><p>Distinguish a promising estimate from a verified improvement.</p></div></div></div></section><section class="wrap section"><div class="section-heading"><div><div class="eyebrow">Resources & insights</div><h2>Keep the thinking moving.</h2></div><a class="arrow-link" href="/resources/">Explore resources ↗</a></div><div class="resource-grid">${resources.slice(0, 2).map(resourceCard).join("")}</div></section>`;
}
export function catalogue(data) {
  const { books, series } = data;
  const cats = [...new Set(books.flatMap((b) => b.categories))].sort();
  return `<div class="wrap">${bread([["Playbooks"]])}<section class="page-intro"><div class="eyebrow">The complete collection</div><h1>Find your next<br><em>business playbook.</em></h1><p>Explore the collection by challenge, series or keyword. Each title offers a focused starting point for practical business thinking.</p></section><section class="catalogue-section"><form class="filters" id="catalogue-filters" role="search"><div><label for="book-query">Search playbooks</label><input id="book-query" name="q" type="search" placeholder="Title, subject or keyword…"></div><div><label for="category">Category</label><select id="category" name="category"><option value="">All categories</option>${cats.map((c) => `<option>${E(c)}</option>`).join("")}</select></div><div><label for="series-filter">Series</label><select id="series-filter" name="series"><option value="">All series</option>${series.map((s) => `<option value="${E(s.id)}">${E(s.name)}</option>`).join("")}</select></div><div><label for="sort">Sort</label><select id="sort" name="sort"><option value="order">Reading order</option><option value="title">Title A–Z</option><option value="newest">Publication date</option></select></div><button class="button" type="submit">Find books</button><button class="reset" type="reset">Reset</button></form><p id="catalogue-count" class="result-count" role="status" aria-live="polite">${books.length} playbooks</p><div id="catalogue-results" class="book-grid">${books
    .map((b) =>
      card(
        b,
        series.find((s) => s.id === b.seriesId),
      ),
    )
    .join(
      "",
    )}</div><div id="catalogue-empty" class="empty" hidden><h2>No playbooks found.</h2><p>Try a broader keyword or reset your filters.</p><button class="button" id="clear-filters">Clear filters</button></div><noscript><p>All published playbooks are displayed. Enable JavaScript to use search and filters.</p></noscript></section></div>`;
}
export function seriesIndex(data) {
  return `<div class="wrap">${bread([["Series"]])}<section class="page-intro"><div class="eyebrow">Connected ideas. Focused reading.</div><h1>The playbook<br><em>series.</em></h1><p>Explore each collection, understand its purpose and choose a reading path that suits your business question.</p></section><section class="series-grid">${data.series.map((s) => `<article class="series-card"><div class="eyebrow">${data.books.filter((b) => b.seriesId === s.id).length} titles in this collection</div><h2><a href="${seriesUrl(s)}">${E(s.name)}</a></h2><p>${E(s.description)}</p><a class="button dark" href="${seriesUrl(s)}">Explore this series ↗</a></article>`).join("") || "<p>No series is published yet.</p>"}</section></div>`;
}
export function seriesDetail(s, data) {
  const books = data.books
    .filter((b) => b.seriesId === s.id)
    .sort((a, b) => {
      const ai = s.readingOrder.indexOf(a.id),
        bi = s.readingOrder.indexOf(b.id);
      return (
        (ai < 0 ? 1e6 + a.seriesNumber : ai) -
        (bi < 0 ? 1e6 + b.seriesNumber : bi)
      );
    });
  return `<div class="wrap">${bread([["Series", "/series/"], [s.name]])}<section class="page-intro"><div class="eyebrow">The collection</div><h1>${E(s.name)}</h1><p>${E(s.description)}</p></section><section class="reading-order"><div><div class="eyebrow">A suggested path</div><h2>Recommended<br>reading order.</h2><p>Follow the sequence or choose the title closest to the question you are working on.</p></div><ol>${books.map((b) => `<li><span>${String(b.seriesNumber).padStart(2, "0")}</span><div><a href="${bookUrl(b)}">${E(b.title)} ↗</a><p>${E(b.shortDescription)}</p></div></li>`).join("") || "<li>Books will appear here when published.</li>"}</ol></section><section class="section"><div class="book-grid">${books.map((b) => card(b, s)).join("")}</div></section></div>`;
}
export function bookDetail(b, data) {
  const s = data.series.find((s) => s.id === b.seriesId);
  const related = data.books
    .filter((x) => x.seriesId === b.seriesId && x.id !== b.id)
    .slice(0, 3);
  const price =
    b.price === null
      ? ""
      : new Intl.NumberFormat("en", {
          style: "currency",
          currency: b.currency,
        }).format(b.price);
  return `<div class="wrap">${bread([["Playbooks", "/playbooks/"], [b.title]])}<section class="book-detail"><div class="detail-cover"><img src="${E(b.cover)}" alt="${E(b.coverAlt)}" width="600" height="900"><p>Website cover presentation</p></div><div class="detail-copy"><div class="eyebrow">${E(s.name)} / ${String(b.seriesNumber).padStart(2, "0")}</div>${b.newRelease ? '<span class="pill">New release</span>' : ""}<h1>${E(b.title)}</h1><p class="subtitle">${E(b.subtitle)}</p><p class="byline">By <a href="/about/">${E(b.author)}</a>${b.contributors.length ? " · With " + E(b.contributors.join(", ")) : ""}${b.edition ? " · " + E(b.edition) : ""}${b.publicationDate ? " · " + E(b.publicationDate) : ""}</p><div class="tags">${b.categories.map((c) => `<a href="/playbooks/?category=${encodeURIComponent(c)}">${E(c)}</a>`).join("")}</div>${paras(b.description)}<div class="purchase-box">${price ? `<strong class="price">${E(price)}</strong>` : ""}<div class="actions">${b.purchaseUrl ? `<a class="button" href="${E(b.purchaseUrl)}" rel="noopener noreferrer">Buy this ${E(b.productType)} ↗</a>` : ""}${b.downloadUrl ? `<a class="button ${b.purchaseUrl ? "outline" : ""}" href="${E(b.downloadUrl)}">${b.purchaseUrl ? "Download resource" : "Download free resource"} ↓</a>` : ""}${b.sampleUrl ? `<a class="quiet-link" href="${E(b.sampleUrl)}">Read a preview ↗</a>` : ""}</div>${!b.purchaseUrl && !b.downloadUrl ? `<p class="availability">${E(b.availability || "Purchase details will be added when confirmed.")}</p>` : b.purchaseUrl ? "<small>Checkout, availability and delivery are handled by the linked seller. Confirm the current price there.</small>" : "<small>This link opens the configured resource.</small>"}</div><a class="arrow-link" href="${seriesUrl(s)}">See the full series & reading order →</a></div></section><section class="book-information"><div><div class="eyebrow">Who it is for</div><h2>Is this your<br>next playbook?</h2>${bullets(b.audience)}</div><div><div class="eyebrow">What you will explore</div><h2>Key takeaways.</h2>${bullets(b.takeaways)}</div></section>${b.tableOfContents.length ? `<section class="contents section"><div class="eyebrow">Inside the book</div><h2>Table of contents</h2><ol>${b.tableOfContents.map((t) => `<li>${E(t)}</li>`).join("")}</ol></section>` : ""}<section class="author-note"><div class="eyebrow">About the author</div><h2>${E(data.site.author)}</h2><p>${E(data.site.authorBio)}</p><a class="arrow-link" href="/about/">More about Timothy ↗</a></section>${related.length ? `<section class="section"><div class="section-heading"><h2>Continue exploring.</h2><a href="${seriesUrl(s)}" class="arrow-link">The full series ↗</a></div><div class="book-grid">${related.map((x) => card(x, s)).join("")}</div></section>` : ""}</div>`;
}
export function about(data) {
  return `<div class="wrap">${bread([["About"]])}<section class="page-intro"><div class="eyebrow">Author · Entrepreneur · Business owner</div><h1>Practical thinking.<br><em>A clear purpose.</em></h1><p>${E(data.site.mission)}</p></section><div class="wide-banner"><img src="/assets/author-banner.png" width="2048" height="753" alt="Timothy Madu, author of the Business Playbook Series"></div><section class="about-columns section"><div><div class="eyebrow">Meet the author</div><h2>${E(data.site.author)}</h2><p>${E(data.site.authorBio)}</p><p>The series is written for entrepreneurs, founders, owners, managers, consultants and professionals who want a structured way to examine business challenges.</p></div><div><div class="eyebrow">Our publishing philosophy</div><h2>Useful questions.<br>Considered decisions.</h2>${bullets(data.site.philosophy)}<blockquote>State only what the evidence supports.</blockquote></div></section><section class="cta-panel"><h2>Find the question<br>you want to work on.</h2><a class="button" href="/playbooks/">Explore the collection ↗</a></section></div>`;
}
export function resourcesIndex(data) {
  return `<div class="wrap">${bread([["Resources & insights"]])}<section class="page-intro"><div class="eyebrow">Keep learning. Keep questioning.</div><h1>Resources<br><em>& insights.</em></h1><p>Short practical reflections, worksheets and supplementary resources to support your next business discussion.</p></section><section class="resource-grid section compact">${data.resources.map(resourceCard).join("") || "<p>New resources are being prepared.</p>"}</section></div>`;
}
export function resourceDetail(r, data) {
  return `<div class="wrap narrow">${bread([["Resources", "/resources/"], [r.title]])}<article class="article"><div class="eyebrow">${E(r.type)} / ${E(r.date)}</div><h1>${E(r.title)}</h1><p class="lead">${E(r.summary)}</p><p class="byline">By ${E(r.author)}</p><div class="prose">${paras(r.body)}</div>${r.downloadUrl ? `<a class="button dark" href="${E(r.downloadUrl)}" download>Download the resource ↓</a>` : ""}</article></div>${
    r.relatedBooks.length
      ? `<section class="wrap section"><div class="eyebrow">Related reading</div><h2>Explore the playbooks.</h2><div class="book-grid">${r.relatedBooks
          .map((id) => data.books.find((b) => b.id === id))
          .filter(Boolean)
          .map((b) =>
            card(
              b,
              data.series.find((s) => s.id === b.seriesId),
            ),
          )
          .join("")}</div></section>`
      : ""
  }`;
}
export function searchPage() {
  return `<div class="wrap narrow">${bread([["Search"]])}<section class="page-intro"><div class="eyebrow">Across the publishing collection</div><h1>What are you<br><em>looking for?</em></h1><p>Search published playbooks, series and practical resources.</p></section><form action="/search/" id="site-search" role="search" class="global-search"><label for="search-query">Search the website</label><div><input id="search-query" name="q" type="search" placeholder="Try customer experience or revenue" maxlength="200"><button class="button dark">Search ↗</button></div></form><div id="search-results" aria-live="polite" class="search-results"><p>Enter a title, subject or keyword to begin.</p></div><noscript><p>Search requires JavaScript. You can browse <a href="/playbooks/">all playbooks</a>, <a href="/series/">series</a> and <a href="/resources/">resources</a>.</p></noscript></div>`;
}
export function contactPage(site) {
  return `<div class="wrap">${bread([["Contact"]])}<section class="page-intro"><div class="eyebrow">A conversation starts here</div><h1>Get in<br><em>touch.</em></h1><p>For questions about the books, publishing enquiries and related professional conversations.</p></section><section class="contact-grid"><div><h2>Contact Timothy.</h2><p>Timothy Madu<br>Yenagoa, Bayelsa State, Nigeria</p>${site.email ? `<p><a class="arrow-link" href="mailto:${E(site.email)}">${E(site.email)} ↗</a></p>` : ""}${site.whatsapp ? `<p><a class="arrow-link" href="https://wa.me/${site.whatsapp.replace("+", "")}">Contact via WhatsApp ↗</a></p>` : ""}${!site.email && !site.whatsapp ? '<p class="notice">Public email and WhatsApp details have not yet been supplied.</p>' : ""}<p class="small">Please avoid sending confidential, payment or sensitive personal information.</p></div><form id="contact-form" class="contact-form"><h2>Send an enquiry.</h2><div id="contact-status" role="status" aria-live="polite" class="notice">Checking enquiry delivery availability…</div><fieldset id="contact-fields" disabled><legend class="sr-only">Your enquiry</legend><label for="contact-name">Your name</label><input id="contact-name" name="name" autocomplete="name" minlength="2" maxlength="120" required><label for="contact-email">Email address</label><input id="contact-email" name="email" type="email" autocomplete="email" maxlength="254" required><label for="contact-message">Your message</label><textarea id="contact-message" name="message" minlength="20" maxlength="5000" rows="6" required></textarea><div class="honeypot" aria-hidden="true"><label for="website">Leave this field empty</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div><div id="turnstile-widget"></div><p class="small">Your details are used to respond to your enquiry. Read the <a href="/privacy/">privacy policy</a>. Spam protection uses Cloudflare Turnstile.</p><button class="button dark" type="submit">Send enquiry ↗</button></fieldset><noscript>JavaScript is required for the enquiry form and spam protection.</noscript></form></section></div>`;
}
export function legalPage(policy) {
  return `<div class="wrap narrow"><section class="article"><div class="eyebrow">Website information / Updated ${E(policy.updated)}</div><h1>${E(policy.title)}</h1><div class="prose">${policy.sections.map((s) => `<h2>${E(s.heading)}</h2><p>${E(s.text)}</p>`).join("")}</div></section></div>`;
}
export function notFound() {
  return '<section class="wrap page-intro"><div class="eyebrow">404 / Page not found</div><h1>A different<br><em>starting point.</em></h1><p>This page may have moved or is not published.</p><div class="actions"><a class="button dark" href="/playbooks/">Browse playbooks ↗</a><a class="arrow-link" href="/search/">Search the site →</a></div></section>';
}
