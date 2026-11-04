import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

// Load Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load content from JSON files
async function loadContent() {
  const contentDir = path.join(process.cwd(), 'content');
  
  const site = JSON.parse(await fs.readFile(path.join(contentDir, 'site.json'), 'utf8'));
  const legal = JSON.parse(await fs.readFile(path.join(contentDir, 'legal.json'), 'utf8'));
  
  const booksDir = path.join(contentDir, 'books');
  const booksFiles = await fs.readdir(booksDir);
  const books = await Promise.all(
    booksFiles
      .filter(f => f.endsWith('.json'))
      .map(async f => JSON.parse(await fs.readFile(path.join(booksDir, f), 'utf8')))
  );
  
  const seriesDir = path.join(contentDir, 'series');
  const seriesFiles = await fs.readdir(seriesDir);
  const series = await Promise.all(
    seriesFiles
      .filter(f => f.endsWith('.json'))
      .map(async f => JSON.parse(await fs.readFile(path.join(seriesDir, f), 'utf8')))
  );
  
  const resourcesDir = path.join(contentDir, 'resources');
  const resourcesFiles = await fs.readdir(resourcesDir);
  const resources = await Promise.all(
    resourcesFiles
      .filter(f => f.endsWith('.json'))
      .map(async f => JSON.parse(await fs.readFile(path.join(resourcesDir, f), 'utf8')))
  );
  
  return { site, legal, books, series, resources };
}

// Migrate to Supabase
async function migrate() {
  console.log('Loading content from JSON files...');
  const content = await loadContent();
  
  console.log('Migrating to Supabase...');
  
  // Migrate site settings
  console.log('Migrating site settings...');
  const { error: siteError } = await supabase
    .from('site_settings')
    .upsert({
      id: '00000000-0000-0000-0000-000000000001',
      name: content.site.name,
      author: content.site.author,
      url: content.site.url,
      tagline: content.site.tagline,
      hero_title: content.site.heroTitle,
      hero_description: content.site.heroDescription,
      author_bio: content.site.authorBio,
      mission: content.site.mission,
      seo_description: content.site.seoDescription,
      social_image: content.site.socialImage,
      home_featured: content.site.homeFeatured,
      philosophy: content.site.philosophy,
      email: content.site.email || null,
      whatsapp: content.site.whatsapp || null,
    });
  
  if (siteError) {
    console.error('Error migrating site settings:', siteError);
    throw siteError;
  }
  
  // Migrate legal settings
  console.log('Migrating legal settings...');
  const { error: legalError } = await supabase
    .from('legal_settings')
    .upsert({
      id: '00000000-0000-0000-0000-000000000001',
      privacy_title: content.legal.privacy.title,
      privacy_updated: content.legal.privacy.updated,
      privacy_sections: content.legal.privacy.sections,
      terms_title: content.legal.terms.title,
      terms_updated: content.legal.terms.updated,
      terms_sections: content.legal.terms.sections,
    });
  
  if (legalError) {
    console.error('Error migrating legal settings:', legalError);
    throw legalError;
  }
  
  // Migrate series
  console.log('Migrating series...');
  for (const s of content.series) {
    const { error: seriesError } = await supabase
      .from('series')
      .upsert({
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        reading_order: s.readingOrder,
        status: s.status,
        seo_title: s.seoTitle,
        meta_description: s.metaDescription,
      });
    
    if (seriesError) {
      console.error(`Error migrating series ${s.id}:`, seriesError);
      throw seriesError;
    }
  }
  
  // Migrate books
  console.log('Migrating books...');
  for (const b of content.books) {
    const { error: bookError } = await supabase
      .from('books')
      .upsert({
        id: b.id,
        slug: b.slug,
        series_id: b.seriesId,
        series_number: b.seriesNumber,
        title: b.title,
        subtitle: b.subtitle,
        author: b.author,
        short_description: b.shortDescription,
        description: b.description,
        contributors: b.contributors,
        categories: b.categories,
        tags: b.tags,
        keywords: b.keywords,
        audience: b.audience,
        takeaways: b.takeaways,
        table_of_contents: b.tableOfContents,
        cover: b.cover,
        cover_alt: b.coverAlt,
        sample_url: b.sampleUrl || null,
        purchase_url: b.purchaseUrl || null,
        download_url: b.downloadUrl || null,
        featured: b.featured,
        new_release: b.newRelease,
        price: b.price,
        currency: b.currency,
        product_type: b.productType,
        publication_date: b.publicationDate || null,
        edition: b.edition || null,
        availability: b.availability || null,
        status: b.status,
        seo_title: b.seoTitle,
        meta_description: b.metaDescription,
      });
    
    if (bookError) {
      console.error(`Error migrating book ${b.id}:`, bookError);
      throw bookError;
    }
  }
  
  // Migrate resources
  console.log('Migrating resources...');
  for (const r of content.resources) {
    const { error: resourceError } = await supabase
      .from('resources')
      .upsert({
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        author: r.author,
        type: r.type,
        date: r.date,
        body: r.body,
        categories: r.categories,
        tags: r.tags,
        related_books: r.relatedBooks,
        download_url: r.downloadUrl || null,
        status: r.status,
        seo_title: r.seoTitle,
        meta_description: r.metaDescription,
      });
    
    if (resourceError) {
      console.error(`Error migrating resource ${r.id}:`, resourceError);
      throw resourceError;
    }
  }
  
  console.log('Migration completed successfully!');
}

migrate().catch(console.error);
