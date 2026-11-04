import fs from "node:fs/promises";
import path from "node:path";
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function safeUrl(value, { asset = false } = {}) {
  if (value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  if (
    asset &&
    /^\/assets\/[a-zA-Z0-9_./-]+$/.test(value) &&
    !value.includes("..")
  )
    return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
const requiredString = (o, k, max = 20000) => {
  if (typeof o[k] !== "string" || !o[k].trim() || o[k].length > max)
    throw Error(
      `${k}: a non-empty string (maximum ${max} characters) is required.`,
    );
};
const array = (o, k) => {
  if (
    !Array.isArray(o[k]) ||
    o[k].some((x) => typeof x !== "string" || x.length > 10000)
  )
    throw Error(`${k}: use an array of text values.`);
};
export function validateRecord(type, o) {
  if (!o || typeof o !== "object" || Array.isArray(o))
    throw Error("Use a JSON object.");
  for (const k of ["id", "slug"])
    if (!slugPattern.test(o[k] || "") || o[k].length > 100)
      throw Error(`${k}: use lowercase words separated by hyphens.`);
  if (!["published", "draft"].includes(o.status))
    throw Error("status must be published or draft.");
  requiredString(o, type === "series" ? "name" : "title", 200);
  for (const k of ["seoTitle", "metaDescription"]) requiredString(o, k, 500);
  if (type === "books") {
    for (const k of ["subtitle", "author", "shortDescription", "coverAlt"])
      requiredString(o, k, 1000);
    if (!slugPattern.test(o.seriesId || ""))
      throw Error("Choose a valid seriesId.");
    if (!Number.isInteger(o.seriesNumber) || o.seriesNumber < 1)
      throw Error("seriesNumber must be a positive integer.");
    for (const k of [
      "description",
      "contributors",
      "categories",
      "tags",
      "keywords",
      "audience",
      "takeaways",
      "tableOfContents",
    ])
      array(o, k);
    for (const k of ["cover", "sampleUrl", "purchaseUrl", "downloadUrl"])
      if (!safeUrl(o[k], { asset: true }))
        throw Error(`${k}: use a secure HTTPS URL or an /assets/ path.`);
    if (!o.cover || !o.cover.startsWith("/assets/"))
      throw Error("cover must point to a local /assets/ file.");
    for (const k of ["featured", "newRelease"])
      if (typeof o[k] !== "boolean") throw Error(`${k}: use true or false.`);
    if (o.price !== null && (!Number.isFinite(o.price) || o.price < 0))
      throw Error("price must be a non-negative number or null.");
    if (!/^[A-Z]{3}$/.test(o.currency))
      throw Error("currency must be a three-letter code.");
    if (
      !["book", "bundle", "course", "template", "workbook"].includes(
        o.productType,
      )
    )
      throw Error("Choose a supported productType.");
    for (const k of ["publicationDate", "edition", "availability"])
      if (typeof o[k] !== "string") throw Error(`${k}: text required.`);
    if (o.publicationDate && !/^\d{4}-\d{2}-\d{2}$/.test(o.publicationDate))
      throw Error("publicationDate must be YYYY-MM-DD or empty.");
  }
  if (type === "series") {
    requiredString(o, "description");
    array(o, "readingOrder");
  }
  if (type === "resources") {
    for (const k of ["summary", "author", "type", "date"])
      requiredString(o, k, 1000);
    for (const k of ["body", "categories", "tags", "relatedBooks"]) array(o, k);
    if (!safeUrl(o.downloadUrl, { asset: true }))
      throw Error("downloadUrl must be HTTPS or an /assets/ path.");
  }
  return o;
}
export async function readCollection(root, type) {
  const dir = path.join(root, type);
  const files = (await fs.readdir(dir))
    .filter((f) => f.endsWith(".json"))
    .sort();
  return Promise.all(
    files.map(async (f) => {
      const o = validateRecord(
        type,
        JSON.parse(await fs.readFile(path.join(dir, f), "utf8")),
      );
      if (f !== o.id + ".json")
        throw Error(`${type}/${f}: filename must equal id.json.`);
      return o;
    }),
  );
}
export async function loadContent(root) {
  const [site, legal, books, series, resources] = await Promise.all([
    fs.readFile(path.join(root, "site.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(root, "legal.json"), "utf8").then(JSON.parse),
    readCollection(root, "books"),
    readCollection(root, "series"),
    readCollection(root, "resources"),
  ]);
  validateSettings("site", site);
  validateSettings("legal", legal);
  for (const [type, records] of Object.entries({ books, series, resources })) {
    for (const key of ["id", "slug"])
      if (new Set(records.map((x) => x[key])).size !== records.length)
        throw Error(`Duplicate ${key} in ${type}.`);
  }
  for (const b of books) {
    const s = series.find((x) => x.id === b.seriesId);
    if (!s) throw Error(`${b.id}: unknown seriesId.`);
    if (b.status === "published" && s.status !== "published")
      throw Error(`${b.id}: cannot publish under a draft series.`);
  }
  for (const s of series) {
    if (new Set(s.readingOrder).size !== s.readingOrder.length)
      throw Error(`${s.id}: readingOrder contains duplicates.`);
    for (const id of s.readingOrder)
      if (!books.some((b) => b.id === id && b.seriesId === s.id))
        throw Error(
          `${s.id}: readingOrder references unknown or unrelated book ${id}.`,
        );
  }
  for (const r of resources)
    for (const id of r.relatedBooks)
      if (!books.some((b) => b.id === id))
        throw Error(`${r.id}: unknown related book ${id}.`);
  for (const id of site.homeFeatured)
    if (!books.some((b) => b.id === id))
      throw Error(`Homepage references unknown book ${id}.`);
  return { site, legal, books, series, resources };
}
export function validateSettings(type, o) {
  if (type === "site") {
    for (const k of [
      "name",
      "author",
      "url",
      "tagline",
      "heroTitle",
      "heroDescription",
      "authorBio",
      "mission",
      "seoDescription",
    ])
      requiredString(o, k);
    if (!safeUrl(o.url)) throw Error("Site URL must use HTTPS.");
    for (const k of ["homeFeatured", "philosophy"]) array(o, k);
    if (!safeUrl(o.socialImage, { asset: true }))
      throw Error("Invalid socialImage.");
    if (o.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email))
      throw Error("Invalid contact email.");
    if (o.whatsapp && !/^\+[1-9]\d{6,14}$/.test(o.whatsapp))
      throw Error("WhatsApp must use an international number such as +234...");
  } else if (type === "legal") {
    for (const k of ["privacy", "terms"]) {
      requiredString(o[k] || {}, "title");
      requiredString(o[k], "updated");
      if (!Array.isArray(o[k].sections))
        throw Error("Legal sections must be an array.");
      for (const s of o[k].sections) {
        requiredString(s, "heading");
        requiredString(s, "text");
      }
    }
  }
  return o;
}
export function publicContent(data) {
  return {
    ...data,
    books: data.books.filter((x) => x.status === "published"),
    series: data.series.filter((x) => x.status === "published"),
    resources: data.resources.filter((x) => x.status === "published"),
  };
}
