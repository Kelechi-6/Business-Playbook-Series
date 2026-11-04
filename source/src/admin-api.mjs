import { createClient } from '@supabase/supabase-js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function safeUrl(value, { asset = false } = {}) {
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

function validateRecord(type, o) {
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

// Simple password hashing (for production, use bcrypt or similar)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify admin credentials
async function verifyAdmin(supabase, email, password) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !data) return null;
  
  const passwordHash = await hashPassword(password);
  if (passwordHash !== data.password_hash) return null;
  
  return data;
}

// Generate session token
function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Convert content format to Supabase format
function toSupabaseBook(book) {
  return {
    id: book.id,
    slug: book.slug,
    series_id: book.seriesId,
    series_number: book.seriesNumber,
    title: book.title,
    subtitle: book.subtitle,
    author: book.author,
    short_description: book.shortDescription,
    description: book.description,
    contributors: book.contributors,
    categories: book.categories,
    tags: book.tags,
    keywords: book.keywords,
    audience: book.audience,
    takeaways: book.takeaways,
    table_of_contents: book.tableOfContents,
    cover: book.cover,
    cover_alt: book.coverAlt,
    sample_url: book.sampleUrl || null,
    purchase_url: book.purchaseUrl || null,
    download_url: book.downloadUrl || null,
    featured: book.featured,
    new_release: book.newRelease,
    price: book.price,
    currency: book.currency,
    product_type: book.productType,
    publication_date: book.publicationDate || null,
    edition: book.edition || null,
    availability: book.availability || null,
    status: book.status,
    seo_title: book.seoTitle,
    meta_description: book.metaDescription,
  };
}

function toSupabaseSeries(series) {
  return {
    id: series.id,
    slug: series.slug,
    name: series.name,
    description: series.description,
    reading_order: series.readingOrder,
    status: series.status,
    seo_title: series.seoTitle,
    meta_description: series.metaDescription,
  };
}

function toSupabaseResource(resource) {
  return {
    id: resource.id,
    slug: resource.slug,
    title: resource.title,
    summary: resource.summary,
    author: resource.author,
    type: resource.type,
    date: resource.date,
    body: resource.body,
    categories: resource.categories,
    tags: resource.tags,
    related_books: resource.relatedBooks,
    download_url: resource.downloadUrl || null,
    status: resource.status,
    seo_title: resource.seoTitle,
    meta_description: resource.metaDescription,
  };
}

function fromSupabaseBook(row) {
  return {
    id: row.id,
    slug: row.slug,
    seriesId: row.series_id,
    seriesNumber: row.series_number,
    title: row.title,
    subtitle: row.subtitle,
    author: row.author,
    shortDescription: row.short_description,
    description: row.description,
    contributors: row.contributors,
    categories: row.categories,
    tags: row.tags,
    keywords: row.keywords,
    audience: row.audience,
    takeaways: row.takeaways,
    tableOfContents: row.table_of_contents,
    cover: row.cover,
    coverAlt: row.cover_alt,
    sampleUrl: row.sample_url,
    purchaseUrl: row.purchase_url,
    downloadUrl: row.download_url,
    featured: row.featured,
    newRelease: row.new_release,
    price: row.price,
    currency: row.currency,
    productType: row.product_type,
    publicationDate: row.publication_date,
    edition: row.edition,
    availability: row.availability,
    status: row.status,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
  };
}

function fromSupabaseSeries(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    readingOrder: row.reading_order,
    status: row.status,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
  };
}

function fromSupabaseResource(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    author: row.author,
    type: row.type,
    date: row.date,
    body: row.body,
    categories: row.categories,
    tags: row.tags,
    relatedBooks: row.related_books,
    downloadUrl: row.download_url,
    status: row.status,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
  };
}

// Admin API handler
export async function handleAdminRequest(request, env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Login endpoint
  if (path === '/api/admin/login' && request.method === 'POST') {
    try {
      const { email, password } = await request.json();
      const admin = await verifyAdmin(supabase, email, password);
      
      if (!admin) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const token = generateSessionToken();
      // Store session in Supabase or use KV (simplified here)
      return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  // Simple token check (in production, use proper session management)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const token = authHeader.substring(7);
  // For now, accept any non-empty token (implement proper session validation)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // GET endpoints
  if (request.method === 'GET') {
    if (path === '/api/admin/books') {
      const { data } = await supabase.from('books').select('*');
      return new Response(JSON.stringify(data.map(fromSupabaseBook)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (path === '/api/admin/series') {
      const { data } = await supabase.from('series').select('*');
      return new Response(JSON.stringify(data.map(fromSupabaseSeries)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (path === '/api/admin/resources') {
      const { data } = await supabase.from('resources').select('*');
      return new Response(JSON.stringify(data.map(fromSupabaseResource)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (path.startsWith('/api/admin/books/')) {
      const id = path.split('/').pop();
      const { data } = await supabase.from('books').select('*').eq('id', id).single();
      if (!data) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(fromSupabaseBook(data)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (path.startsWith('/api/admin/series/')) {
      const id = path.split('/').pop();
      const { data } = await supabase.from('series').select('*').eq('id', id).single();
      if (!data) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(fromSupabaseSeries(data)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (path.startsWith('/api/admin/resources/')) {
      const id = path.split('/').pop();
      const { data } = await supabase.from('resources').select('*').eq('id', id).single();
      if (!data) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(fromSupabaseResource(data)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  // POST/PUT endpoints
  if (request.method === 'POST' || request.method === 'PUT') {
    try {
      const body = await request.json();
      
      if (path === '/api/admin/books' || path.startsWith('/api/admin/books/')) {
        validateRecord('books', body);
        const supabaseData = toSupabaseBook(body);
        const { error } = await supabase.from('books').upsert(supabaseData);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (path === '/api/admin/series' || path.startsWith('/api/admin/series/')) {
        validateRecord('series', body);
        const supabaseData = toSupabaseSeries(body);
        const { error } = await supabase.from('series').upsert(supabaseData);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (path === '/api/admin/resources' || path.startsWith('/api/admin/resources/')) {
        validateRecord('resources', body);
        const supabaseData = toSupabaseResource(body);
        const { error } = await supabase.from('resources').upsert(supabaseData);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  // DELETE endpoints
  if (request.method === 'DELETE') {
    if (path.startsWith('/api/admin/books/')) {
      const id = path.split('/').pop();
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (path.startsWith('/api/admin/series/')) {
      const id = path.split('/').pop();
      const { error } = await supabase.from('series').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (path.startsWith('/api/admin/resources/')) {
      const id = path.split('/').pop();
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
