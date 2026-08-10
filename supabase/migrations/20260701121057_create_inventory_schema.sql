
/*
# Inventory Management System — Initial Schema

## Overview
Creates the full schema for an Arabic RTL Inventory Management System with
unlimited-depth category nesting and product management.

## 1. New Tables

### `categories`
Self-referencing table that supports unlimited nesting depth.
- `id` — UUID primary key
- `name` — Category name (Arabic text)
- `parent_id` — NULL for root categories; references parent category otherwise
- `sort_order` — Integer for ordering siblings
- `created_at` — Timestamp

### `products`
Product inventory table with pricing, dimensions, and stock tracking.
- `id` — UUID primary key
- `name` — Product name (Arabic)
- `code` — Unique product code (SKU)
- `category_id` — FK → categories(id)
- `quantity` — Current stock quantity
- `length_cm`, `width_cm`, `height_cm` — Dimensions in centimeters
- `size` — Free-text or dropdown size label
- `base_price` — Base price (decimal)
- `margin_pct` — Optional margin/tax percentage (default 0)
- `final_price` — Computed final price stored for query efficiency
- `image_url` — URL of uploaded product image
- `created_at`, `updated_at` — Timestamps

## 2. Security
- RLS enabled on both tables.
- Single-tenant app (no auth) — policies allow `anon` + `authenticated` for full CRUD.

## 3. Indexes
- `categories.parent_id` for tree traversal
- `products.category_id` for filtering
- `products.code` unique constraint for SKU deduplication
*/

-- Categories (self-referencing tree)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 0,
  length_cm numeric(10,2),
  width_cm numeric(10,2),
  height_cm numeric(10,2),
  size text,
  base_price numeric(12,2) NOT NULL DEFAULT 0,
  margin_pct numeric(5,2) NOT NULL DEFAULT 0,
  final_price numeric(12,2) GENERATED ALWAYS AS (
    base_price * (1 + margin_pct / 100.0)
  ) STORED,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- Seed some sample categories
INSERT INTO categories (id, name, parent_id, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'المواد الخام', NULL, 1),
  ('11111111-0000-0000-0000-000000000002', 'المنتجات المصنعة بالكامل', NULL, 2),
  ('11111111-0000-0000-0000-000000000003', 'المواد الاستهلاكية', NULL, 3),
  ('22222222-0000-0000-0000-000000000001', 'المبيدات والأسمدة', '11111111-0000-0000-0000-000000000002', 1),
  ('22222222-0000-0000-0000-000000000002', 'المنتجات الكيميائية', '11111111-0000-0000-0000-000000000002', 2),
  ('33333333-0000-0000-0000-000000000001', 'المبيدات', '22222222-0000-0000-0000-000000000001', 1),
  ('33333333-0000-0000-0000-000000000002', 'الأسمدة', '22222222-0000-0000-0000-000000000001', 2),
  ('44444444-0000-0000-0000-000000000001', 'مبيدات حشرية', '33333333-0000-0000-0000-000000000001', 1),
  ('44444444-0000-0000-0000-000000000002', 'مبيدات فطرية', '33333333-0000-0000-0000-000000000001', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed sample products
INSERT INTO products (name, code, category_id, quantity, length_cm, width_cm, height_cm, size, base_price, margin_pct, image_url) VALUES
  ('مبيد حشري متعدد الأغراض', 'P-001', '44444444-0000-0000-0000-000000000001', 150, 20, 10, 30, 'كبير', 45.00, 15, 'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('سماد نيتروجيني', 'P-002', '33333333-0000-0000-0000-000000000002', 8, 40, 40, 60, 'كيس 25 كجم', 120.00, 10, 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('مبيد فطري للورد', 'P-003', '44444444-0000-0000-0000-000000000002', 0, 15, 8, 25, 'صغير', 35.00, 20, 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('خامة بلاستيكية خام', 'P-004', '11111111-0000-0000-0000-000000000001', 500, 100, 80, 20, 'رول', 200.00, 5, 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('مادة كيميائية معالجة', 'P-005', '22222222-0000-0000-0000-000000000002', 3, 30, 20, 40, 'وسط', 95.00, 25, 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=400')
ON CONFLICT (code) DO NOTHING;
