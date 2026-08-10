
/*
# Inventory System — Phase 2 Updates

## Changes
1. Add `unit` column to products (e.g. لتر، كجم، قطعة، زجاجة)
2. Add more categories for a richer demo tree
3. Seed 20+ additional products across all categories

## Notes
- `unit` defaults to 'قطعة' (piece) for existing rows
- All new inserts are ON CONFLICT DO NOTHING so re-running is safe
*/

-- Add unit column
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'قطعة';

-- More categories
INSERT INTO categories (id, name, parent_id, sort_order) VALUES
  ('55555555-0000-0000-0000-000000000001', 'مبيدات الأعشاب',       '33333333-0000-0000-0000-000000000001', 3),
  ('55555555-0000-0000-0000-000000000002', 'سماد عضوي',            '33333333-0000-0000-0000-000000000002', 1),
  ('55555555-0000-0000-0000-000000000003', 'سماد كيميائي مركب',    '33333333-0000-0000-0000-000000000002', 2),
  ('66666666-0000-0000-0000-000000000001', 'مواد تعبئة وتغليف',    '11111111-0000-0000-0000-000000000001', 2),
  ('66666666-0000-0000-0000-000000000002', 'مواد خام معدنية',      '11111111-0000-0000-0000-000000000001', 3),
  ('77777777-0000-0000-0000-000000000001', 'منظفات صناعية',        '11111111-0000-0000-0000-000000000003', 1),
  ('77777777-0000-0000-0000-000000000002', 'مستلزمات مكتبية',     '11111111-0000-0000-0000-000000000003', 2),
  ('77777777-0000-0000-0000-000000000003', 'معدات وأدوات',         '11111111-0000-0000-0000-000000000003', 3)
ON CONFLICT (id) DO NOTHING;

-- More products
INSERT INTO products (name, code, category_id, quantity, length_cm, width_cm, height_cm, size, base_price, margin_pct, image_url, unit) VALUES
  ('مبيد حشري للبعوض',         'P-006', '44444444-0000-0000-0000-000000000001', 45,  12,  6, 22, 'صغير',    28.00, 18, 'https://images.pexels.com/photos/4033148/pexels-photo-4033148.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('مبيد حشري للنمل',          'P-007', '44444444-0000-0000-0000-000000000001', 120, 10,  5, 18, 'صغير',    22.00, 15, 'https://images.pexels.com/photos/4202927/pexels-photo-4202927.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('مبيد فطري للخضروات',       'P-008', '44444444-0000-0000-0000-000000000002', 0,   15,  8, 25, 'وسط',     38.00, 20, 'https://images.pexels.com/photos/1656666/pexels-photo-1656666.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('مبيد أعشاب انتقائي',       'P-009', '55555555-0000-0000-0000-000000000001', 60,  20, 10, 30, 'كبير',    55.00, 12, 'https://images.pexels.com/photos/2286895/pexels-photo-2286895.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('مبيد أعشاب كلي',           'P-010', '55555555-0000-0000-0000-000000000001', 8,   25, 12, 35, 'كبير',    65.00, 10, 'https://images.pexels.com/photos/6231943/pexels-photo-6231943.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('سماد عضوي طبيعي',          'P-011', '55555555-0000-0000-0000-000000000002', 200, 40, 40, 60, 'كيس 25 كجم', 85.00, 8, 'https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=400', 'كجم'),
  ('كمبوست معالج',              'P-012', '55555555-0000-0000-0000-000000000002', 150, 50, 50, 80, 'كيس 50 كجم', 140.00, 10, 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=400', 'كجم'),
  ('سماد NPK 20-20-20',        'P-013', '55555555-0000-0000-0000-000000000003', 5,   40, 40, 60, 'كيس 25 كجم', 130.00, 15, 'https://images.pexels.com/photos/5503144/pexels-photo-5503144.jpeg?auto=compress&cs=tinysrgb&w=400', 'كجم'),
  ('سماد يوريا',                'P-014', '55555555-0000-0000-0000-000000000003', 300, 60, 40, 80, 'كيس 50 كجم', 95.00,  12, 'https://images.pexels.com/photos/5503144/pexels-photo-5503144.jpeg?auto=compress&cs=tinysrgb&w=400', 'كجم'),
  ('مادة كيميائية 98%',         'P-015', '22222222-0000-0000-0000-000000000002', 25,  30, 20, 40, 'عبوة 1 لتر', 180.00, 30, 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('حمض الكبريتيك 96%',        'P-016', '22222222-0000-0000-0000-000000000002', 0,   35, 25, 45, 'عبوة 5 لتر', 320.00, 25, 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('بلاستيك HDPE خام',         'P-017', '11111111-0000-0000-0000-000000000001', 1200, 100, 80, 20, 'رول 100م', 450.00, 8, 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=400', 'كجم'),
  ('كرتون مموج خام',            'P-018', '66666666-0000-0000-0000-000000000001', 500, 120, 80, 10, 'ورقة A1', 8.50,   20, 'https://images.pexels.com/photos/4483942/pexels-photo-4483942.jpeg?auto=compress&cs=tinysrgb&w=400', 'قطعة'),
  ('أكياس بلاستيك شفاف',       'P-019', '66666666-0000-0000-0000-000000000001', 3000, 30, 20, 5, 'حزمة 100', 12.00, 25, 'https://images.pexels.com/photos/4483942/pexels-photo-4483942.jpeg?auto=compress&cs=tinysrgb&w=400', 'حزمة'),
  ('نحاس خام',                  'P-020', '66666666-0000-0000-0000-000000000002', 80,  50, 30, 10, 'قضيب 6م', 620.00, 5, 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=400', 'كجم'),
  ('منظف صناعي متعدد الأغراض', 'P-021', '77777777-0000-0000-0000-000000000001', 7,   25, 15, 35, 'جالون 5 لتر', 45.00, 20, 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('مطهر أرضيات',               'P-022', '77777777-0000-0000-0000-000000000001', 180, 20, 10, 30, 'عبوة 1 لتر', 18.00, 22, 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=400', 'لتر'),
  ('ورق طباعة A4',              'P-023', '77777777-0000-0000-0000-000000000002', 250, 30, 21,  5, 'رزمة 500',  25.00, 15, 'https://images.pexels.com/photos/4483942/pexels-photo-4483942.jpeg?auto=compress&cs=tinysrgb&w=400', 'رزمة'),
  ('أقلام حبر جاف',             'P-024', '77777777-0000-0000-0000-000000000002', 600,  1,  1, 15, 'علبة 50',    35.00, 20, 'https://images.pexels.com/photos/4483942/pexels-photo-4483942.jpeg?auto=compress&cs=tinysrgb&w=400', 'علبة'),
  ('مفك براغي كهربائي',         'P-025', '77777777-0000-0000-0000-000000000003', 3,   25,  8, 20, 'وسط',      280.00, 10, 'https://images.pexels.com/photos/4483942/pexels-photo-4483942.jpeg?auto=compress&cs=tinysrgb&w=400', 'قطعة'),
  ('شريط لاصق صناعي',          'P-026', '77777777-0000-0000-0000-000000000001', 400,  5,  5, 10, 'رول كبير',   15.00, 25, 'https://images.pexels.com/photos/4483942/pexels-photo-4483942.jpeg?auto=compress&cs=tinysrgb&w=400', 'رول')
ON CONFLICT (code) DO NOTHING;

-- Update existing products to have units
UPDATE products SET unit = 'لتر' WHERE code IN ('P-001','P-002','P-003');
UPDATE products SET unit = 'كجم' WHERE code = 'P-004';
UPDATE products SET unit = 'لتر' WHERE code = 'P-005';
