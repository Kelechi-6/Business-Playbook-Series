"use strict";
const $ = (s) => document.querySelector(s),
  E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const menu = $(".menu-toggle");
if (menu) {
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", open);
    $("#main-nav").classList.toggle("open", open);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      menu.setAttribute("aria-expanded", "false");
      $("#main-nav").classList.remove("open");
      if (document.activeElement?.closest("#main-nav")) menu.focus();
    }
  });
}
let indexPromise;
const getIndex = () =>
  (indexPromise ??= fetch("/search-index.json").then((r) => {
    if (!r.ok) throw Error("Search is unavailable.");
    return r.json();
  }));
function bookCard(b, series) {
  return `<article class="book-card"><a class="cover-link" href="${E(b.url)}" tabindex="-1" aria-hidden="true"><img src="${E(b.cover)}" width="600" height="900" alt="" loading="lazy">${b.newRelease ? '<span class="new-badge">New release</span>' : ""}</a><div class="card-copy"><div class="eyebrow">${E(b.categories[0] || "Playbook")} <span>/ ${String(b.seriesNumber).padStart(2, "0")}</span></div><h3><a href="${E(b.url)}">${E(b.title)}</a></h3><p>${E(b.summary)}</p><div class="card-bottom"><span>${E(series?.title || "")}</span><a class="arrow-link" href="${E(b.url)}">Explore ↗</a></div></div></article>`;
}
const match = (item, q) =>
  q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => item.searchText.includes(t));
if ($("#catalogue-filters")) {
  const form = $("#catalogue-filters"),
    params = new URLSearchParams(location.search);
  for (const name of ["q", "category", "series", "sort"])
    if (params.has(name)) form.elements[name].value = params.get(name);
  const update = async (push = true) => {
    try {
      const idx = await getIndex(),
        q = form.elements.q.value.slice(0, 200),
        cat = form.elements.category.value,
        series = form.elements.series.value,
        sort = form.elements.sort.value;
      let list = idx.filter(
        (i) =>
          i.type === "Playbook" &&
          (!cat || i.categories.includes(cat)) &&
          (!series || i.seriesId === series) &&
          match(i, q),
      );
      list.sort((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : sort === "newest"
            ? (b.date || "").localeCompare(a.date || "") ||
              a.seriesNumber - b.seriesNumber
            : a.seriesId.localeCompare(b.seriesId) ||
              a.seriesNumber - b.seriesNumber,
      );
      $("#catalogue-results").innerHTML = list
        .map((b) =>
          bookCard(
            b,
            idx.find((s) => s.type === "Series" && s.id === b.seriesId),
          ),
        )
        .join("");
      $("#catalogue-empty").hidden = list.length > 0;
      $("#catalogue-count").textContent =
        `${list.length} ${list.length === 1 ? "playbook" : "playbooks"} found`;
      if (push) {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (cat) p.set("category", cat);
        if (series) p.set("series", series);
        if (sort !== "order") p.set("sort", sort);
        history.replaceState(
          null,
          "",
          location.pathname + (p.size ? "?" + p : ""),
        );
      }
    } catch {
      $("#catalogue-count").textContent =
        "Filtering is unavailable. Reload to see the full collection.";
    }
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = form.elements['email'];
    const email = emailInput.value.trim();
    if (!validateEmail(email)) {
        show('Please enter a valid email address.', true);
        return;
    }
    fetch('/api/contact-config')
        .then((r) => r.json())
        .then((config) => {
            if (!config.enabled) {
                show('Contact form is currently unavailable.', true);
                return;
            }
            // Submit the email to your server
            return fetch('/api/submit-email', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email })
            });
        })
        .then(() => show('Email submitted successfully!'))
        .catch(() => show('An error occurred while submitting the email.', true));

    e.preventDefault();
    update();
  });
  form.addEventListener("change", () => update());
  let timer;
  form.elements.q.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(update, 150);
  });
  form.addEventListener("reset", () =>
    setTimeout(() => {
      form.elements.q.value = "";
      form.elements.category.value = "";
      form.elements.series.value = "";
      form.elements.sort.value = "order";
      update();
    }, 0),
  );
  $("#clear-filters").addEventListener("click", () => form.reset());
  if (params.size) update(false);
}
if ($("#site-search")) {
  const form = $("#site-search"),
    input = $("#search-query"),
    results = $("#search-results");
  input.value = new URLSearchParams(location.search).get("q") || "";
  const search = async () => {
    const q = input.value.trim().slice(0, 200);
    history.replaceState(
      null,
      "",
      location.pathname + (q ? "?q=" + encodeURIComponent(q) : ""),
    );
    if (!q) {
      results.innerHTML = "<p>Enter a title, subject or keyword to begin.</p>";
      return;
    }
    try {
      const list = (await getIndex()).filter((i) => match(i, q));
      results.innerHTML =
        `<p class="result-count">${list.length} ${list.length === 1 ? "result" : "results"} for “${E(q)}”</p>` +
        (list.length
          ? list
              .map(
                (i) =>
                  `<article class="search-result"><small>${E(i.type)}</small><h2><a href="${E(i.url)}">${E(i.title)} ↗</a></h2><p>${E(i.summary)}</p></article>`,
              )
              .join("")
          : '<div class="empty"><h2>No results found.</h2><p>Try fewer words, another subject or browse all playbooks.</p><a class="button dark" href="/playbooks/">Browse the collection ↗</a></div>');
    } catch {
      results.innerHTML =
        "<p>Search is temporarily unavailable. Please browse the navigation links.</p>";
    }
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = form.elements['email'];
    const email = emailInput.value.trim();
    if (!validateEmail(email)) {
        show('Please enter a valid email address.', true);
        return;
    }
    fetch('/api/contact-config')
        .then((r) => r.json())
        .then((config) => {
            if (!config.enabled) {
                show('Contact form is currently unavailable.', true);
                return;
            }
            // Submit the email to your server
            return fetch('/api/submit-email', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email })
            });
        })
        .then(() => show('Email submitted successfully!'))
        .catch(() => show('An error occurred while submitting the email.', true));

    e.preventDefault();
    search();
  });
  if (input.value) search();
}
if ($("#contact-form")) {
  const form = $("#contact-form"),
    status = $("#contact-status"),
    fields = $("#contact-fields");
  let widget = null;
  const show = (msg, error = false) => {
    status.textContent = msg;
    status.classList.toggle("error", error);
  };
  fetch("/api/contact-config")
    .then((r) => r.json())
    .then((config) => {
      if (!config.enabled) {
        show(
          "The enquiry form is not yet enabled. Public contact details will be added when supplied.",
        );
        return;
      }
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => {
        widget = window.turnstile.render("#turnstile-widget", {
          sitekey: config.siteKey,
          action: "contact",
          theme: "light",
        });
        fields.disabled = false;
        show("Complete the fields and spam protection to send an enquiry.");
      };
      script.onerror = () =>
        show(
          "Spam protection could not load. Please reload or use the published contact details.",
          true,
        );
      document.head.append(script);
    })
    .catch(() =>
      show(
        "Enquiry availability could not be checked. Please try later.",
        true,
      ),
    );
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector("button[type=submit]"),
      token = window.turnstile?.getResponse(widget);
    if (!token) {
      show("Please complete spam protection.", true);
      return;
    }
    button.disabled = true;
    show("Sending your enquiry…");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.elements.name.value,
          email: form.elements.email.value,
          message: form.elements.message.value,
          website: form.elements.website.value,
          token,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw Error(body.error || "Your message could not be sent.");
      show(body.message);
      form.reset();
    } catch (err) {
      show(err.message || "Your message could not be sent.", true);
    } finally {
      button.disabled = false;
      window.turnstile?.reset(widget);
    }
  });
}
