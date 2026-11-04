-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Site settings table
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  url TEXT NOT NULL,
  tagline TEXT NOT NULL,
  hero_title TEXT NOT NULL,
  hero_description TEXT NOT NULL,
  author_bio TEXT NOT NULL,
  mission TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  social_image TEXT NOT NULL,
  home_featured TEXT[] NOT NULL,
  philosophy TEXT[] NOT NULL,
  email TEXT,
  whatsapp TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal settings table
CREATE TABLE legal_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  privacy_title TEXT NOT NULL,
  privacy_updated TEXT NOT NULL,
  privacy_sections JSONB NOT NULL,
  terms_title TEXT NOT NULL,
  terms_updated TEXT NOT NULL,
  terms_sections JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Series table
CREATE TABLE series (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reading_order TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('published', 'draft')),
  seo_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  series_id TEXT NOT NULL REFERENCES series(id),
  series_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  author TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT[] NOT NULL,
  contributors TEXT[] NOT NULL,
  categories TEXT[] NOT NULL,
  tags TEXT[] NOT NULL,
  keywords TEXT[] NOT NULL,
  audience TEXT[] NOT NULL,
  takeaways TEXT[] NOT NULL,
  table_of_contents TEXT[] NOT NULL,
  cover TEXT NOT NULL,
  cover_alt TEXT NOT NULL,
  sample_url TEXT,
  purchase_url TEXT,
  download_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  new_release BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC,
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  product_type TEXT NOT NULL CHECK (product_type IN ('book', 'bundle', 'course', 'template', 'workbook')),
  publication_date TEXT,
  edition TEXT,
  availability TEXT,
  status TEXT NOT NULL CHECK (status IN ('published', 'draft')),
  seo_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  author TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  body TEXT[] NOT NULL,
  categories TEXT[] NOT NULL,
  tags TEXT[] NOT NULL,
  related_books TEXT[] NOT NULL,
  download_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('published', 'draft')),
  seo_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table for authentication
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_books_series_id ON books(series_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_series_status ON series(status);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_related_books ON resources USING GIN(related_books);
