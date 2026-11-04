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
let token =
  location.hash.slice(1) || sessionStorage.getItem("editor-token") || "";
if (location.hash) {
  sessionStorage.setItem("editor-token", token);
  history.replaceState(null, "", location.pathname);
}
let data,
  type = "books",
  record,
  originalId = null;
const status = (msg, error = false) => {
  $("#status").textContent = msg;
  $("#status").classList.toggle("error", error);
};
async function api(route, body) {
  const r = await fetch("/api/" + route, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await r.json();
  if (!r.ok) throw Error(result.error || "Request failed.");
  return result;
}
const labels = {
  id: "Unique ID",
  slug: "URL slug",
  seriesId: "Series",
  seriesNumber: "Number within the series",
  cover: "Cover image path",
  coverAlt: "Cover description for accessibility",
  shortDescription: "Short description",
  description: "Long description (one paragraph per line)",
  publicationDate: "Publication date (YYYY-MM-DD, optional)",
  tableOfContents: "Table of contents (one heading per line)",
  sampleUrl: "Sample or preview URL",
  purchaseUrl: "Purchase / checkout URL",
  downloadUrl: "Free download URL (never place paid files here)",
  featured: "Featured book",
  newRelease: "New release",
  status: "Publishing status",
  seoTitle: "SEO page title",
  metaDescription: "SEO meta description",
  homeFeatured: "Homepage featured book IDs (one per line)",
  socialImage: "Social sharing image path",
  heroTitle: "Homepage heading",
  heroDescription: "Homepage description",
  authorBio: "Author biography",
  readingOrder: "Recommended reading order (book IDs, one per line)",
  relatedBooks: "Related book IDs (one per line)",
  whatsapp: "Public WhatsApp number (+country code)",
  email: "Public contact email",
  price: "Price (leave blank when not confirmed)",
  productType: "Product type",
};
const helps = {
  id: "Use lowercase words and hyphens. Keep an existing ID unchanged.",
  slug: "Use lowercase words and hyphens. Changing this changes the page URL. Update external links or add a host redirect.",
  status:
    "Published records appear on the website; drafts stay in source content only.",
  cover:
    "Use the upload button below or a local /assets/ path. Recommended portrait aspect ratio: 2:3.",
  seriesId: "Create the series first if it does not exist.",
  publicationDate: "Leave empty until the date is confirmed.",
  price:
    "Do not enter an unverified price. The external seller controls the transaction.",
  downloadUrl:
    "Only link to files that may be freely shared. Paid content belongs with the checkout provider.",
  categories:
    "One category per line. New labels automatically appear in catalogue filters.",
  homeFeatured: "Use record IDs, not URL slugs. Draft books remain hidden.",
  url: "The canonical HTTPS site origin. Update this before migrating or attaching a custom domain.",
};
function field(k, v) {
  const label =
    labels[k] ||
    k.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());
  let control;
  if (k === "seriesId")
    control = `<select name="${k}">${data.series.map((s) => `<option value="${E(s.id)}" ${v === s.id ? "selected" : ""}>${E(s.name)} (${E(s.status)})</option>`).join("")}</select>`;
  else if (["status", "productType"].includes(k)) {
    const values =
      k === "status"
        ? ["draft", "published"]
        : ["book", "bundle", "course", "template", "workbook"];
    control = `<select name="${k}">${values.map((x) => `<option ${v === x ? "selected" : ""}>${x}</option>`).join("")}</select>`;
  } else if (typeof v === "boolean")
    control = `<input type="checkbox" name="${k}" ${v ? "checked" : ""}> Enabled`;
  else if (Array.isArray(v))
    control = `<textarea name="${k}" data-kind="array">${E(v.join("\n"))}</textarea>`;
  else if (
    [
      "description",
      "shortDescription",
      "subtitle",
      "summary",
      "authorBio",
      "mission",
      "heroDescription",
      "metaDescription",
    ].includes(k)
  )
    control = `<textarea name="${k}">${E(v)}</textarea>`;
  else
    control = `<input name="${k}" value="${E(v)}" ${["price", "seriesNumber"].includes(k) ? 'type="number" min="0" step="' + (k === "price" ? ".01" : "1") + '"' : ""} ${k === "id" && originalId ? "readonly" : ""}>`;
  return `<div class="field"><label for="field-${k}">${E(label)}</label>${control.replace('name="' + k + '"', 'id="field-' + k + '" name="' + k + '"')}${helps[k] ? `<small>${E(helps[k])}</small>` : ""}</div>`;
}
function showRecord(r, isNew = false) {
  record = structuredClone(r);
  originalId = isNew ? null : r.id || null;
  $("#fields").innerHTML =
    `<h2>${isNew ? "Add a new record" : E(r.title || r.name || (type === "site" ? "Website settings" : "Privacy & terms"))}</h2><p class="help">Content is saved independently of the page templates. A valid save rebuilds the website automatically.</p>` +
    (type === "legal"
      ? `<div class="field"><label for="legal-json">Legal content (JSON)</label><textarea id="legal-json" rows="28">${E(JSON.stringify(r, null, 2))}</textarea><small>Edit the text values while preserving JSON keys and punctuation. Read docs/CONTENT-GUIDE.md.</small></div>`
      : Object.entries(record)
          .map(([k, v]) => field(k, v))
          .join("")) +
    (type === "books"
      ? '<div class="upload"><label for="cover-upload">Upload or replace cover</label><input type="file" id="cover-upload" accept="image/png,image/jpeg,image/webp"><p class="hint">PNG, JPEG or WebP · up to 5 MiB · a new file is created so existing covers are preserved.</p></div>'
      : "");
  $("#save").disabled = false;
  if ($("#cover-upload"))
    $("#cover-upload").addEventListener("change", uploadCover);
  document
    .querySelectorAll("#records button")
    .forEach((b) => b.classList.toggle("selected", b.dataset.id === r.id));
}
function choose() {
  type = $("#collection").value;
  $("#new").hidden = ["site", "legal"].includes(type);
  if (["site", "legal"].includes(type)) {
    $("#records").innerHTML = "";
    showRecord(data[type]);
    return;
  }
  $("#records").innerHTML = data[type]
    .map(
      (r) =>
        `<button data-id="${E(r.id)}">${E(r.title || r.name)}<br><small>${E(r.status)}</small></button>`,
    )
    .join("");
  document
    .querySelectorAll("#records button")
    .forEach((b) =>
      b.addEventListener("click", () =>
        showRecord(data[type].find((r) => r.id === b.dataset.id)),
      ),
    );
  if (data[type].length) showRecord(data[type][0]);
  else {
    $("#fields").innerHTML =
      "<h2>No records yet.</h2><p>Use Add new record to begin.</p>";
    $("#save").disabled = true;
  }
}
async function refresh() {
  data = await api("content");
  choose();
}
$("#collection").addEventListener("change", choose);
$("#new").addEventListener("click", () => {
  const basics = {
    id: "",
    slug: "",
    status: "draft",
    seoTitle: "",
    metaDescription: "",
  };
  let r;
  if (type === "books")
    r = {
      ...basics,
      title: "",
      subtitle: "",
      seriesId: data.series[0]?.id || "",
      seriesNumber: 1,
      cover: "/assets/customer-friction.svg",
      coverAlt: "",
      shortDescription: "",
      description: [],
      author: data.site.author,
      contributors: [],
      publicationDate: "",
      edition: "",
      categories: [],
      tags: [],
      keywords: [],
      audience: [],
      takeaways: [],
      tableOfContents: [],
      sampleUrl: "",
      price: null,
      currency: "USD",
      purchaseUrl: "",
      downloadUrl: "",
      productType: "book",
      featured: false,
      newRelease: false,
      availability: "",
    };
  else if (type === "series")
    r = { ...basics, name: "", description: "", readingOrder: [] };
  else
    r = {
      ...basics,
      title: "",
      summary: "",
      type: "Insight",
      author: data.site.author,
      date: new Date().toISOString().slice(0, 10),
      categories: [],
      tags: [],
      body: [],
      relatedBooks: [],
      downloadUrl: "",
    };
  showRecord(r, true);
  $("#fields input")?.focus();
  status("New draft. Complete the details, then save.");
});
$("#record-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const save = $("#save");
  save.disabled = true;
  try {
    let value;
    if (type === "legal") value = JSON.parse($("#legal-json").value);
    else {
      value = structuredClone(record);
      for (const [k, old] of Object.entries(record)) {
        const el = e.target.elements[k];
        if (!el) continue;
        value[k] =
          typeof old === "boolean"
            ? el.checked
            : Array.isArray(old)
              ? el.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : k === "price"
                ? el.value.trim() === ""
                  ? null
                  : Number(el.value)
                : typeof old === "number"
                  ? Number(el.value)
                  : el.value.trim();
      }
    }
    const result = await api("save", { type, record: value, originalId });
    const selected = value.id;
    data = await api("content");
    choose();
    if (selected) showRecord(data[type].find((x) => x.id === selected));
    status(result.message);
  } catch (err) {
    status(err.message, true);
  } finally {
    save.disabled = false;
  }
});
async function uploadCover(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    status("Cover is too large. Use an image under 5 MiB.", true);
    return;
  }
  try {
    status("Uploading cover…");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const encoded = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
    });
    const result = await api("upload", { base64: encoded });
    $("#field-cover").value = result.url;
    status(
      "Cover uploaded. Save the book to use it. Add an accurate cover description.",
    );
  } catch (err) {
    status(err.message, true);
  }
}
$("#backup").addEventListener("click", async () => {
  try {
    const r = await fetch("/api/export", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!r.ok) throw Error("Backup failed.");
    const url = URL.createObjectURL(await r.blob()),
      a = document.createElement("a");
    a.href = url;
    a.download = "publishing-content-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status(
      "Content JSON exported. For a full backup including covers, run npm run export.",
    );
  } catch (e) {
    status(e.message, true);
  }
});
$("#rebuild").addEventListener("click", async () => {
  try {
    status("Validating and rebuilding…");
    const r = await api("build", {});
    status(r.message + " " + r.pages + " pages.");
  } catch (e) {
    status(e.message, true);
  }
});
refresh()
  .then(() => status("Ready. Select a record or add a new one."))
  .catch((e) => {
    status(e.message, true);
    $("#save").disabled = true;
  });
