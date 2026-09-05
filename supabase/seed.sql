-- ============================================================================
-- VIVENTRA — seed data (optional)
-- Run after schema.sql if you want to start with the original demo catalogue
-- instead of an empty store. Safe to skip and add everything from the admin
-- panel instead.
-- ============================================================================

insert into categories (id, name, icon, sort_order) values
  ('furniture',   'Furniture',   '🛋️', 1),
  ('wall-art',    'Wall Art',    '🖼️', 2),
  ('lighting',    'Lighting',    '🕯️', 3),
  ('accessories', 'Accessories', '🏺', 4)
on conflict (id) do nothing;

insert into products (name, category, price, emoji, badge, image, discount, discount_type, description, features, visible) values
  ('Malibu Rattan Armchair', 'furniture',   18500, '🪑', 'Bestseller', null, 0,   'percent', 'Handwoven rattan frame with plush linen cushions in warm cream. Structurally robust yet visually light — a statement piece that breathes.', array['Sustainable rattan frame','Linen upholstery','Easy assembly','Dimensions: 72×68×80 cm'], true),
  ('Floating Oak Shelf',     'furniture',   8900,  '🪵', 'New',        null, 10,  'percent', 'Solid oak wall-mounted shelf with a natural grain finish. Supports up to 15kg.', array['Solid oak wood','Natural oil finish','Hardware included','Length: 90 cm'], true),
  ('Abstract Terra Print',   'wall-art',    3500,  '🎨', 'New',        null, 0,   'percent', 'Giclée print on 300gsm archival paper. Earth-toned abstract composition with warm terracotta and sage tones.', array['Archival giclée print','300gsm cotton paper','Unframed','Size: 50×70 cm'], true),
  ('Botanical Gallery Set',  'wall-art',    5800,  '🌾', 'Bestseller', null, 500, 'flat',    'Set of 3 minimalist botanical prints in line-art style on cream matte paper.', array['Set of 3 prints','Matte cream paper','Each: 30×40 cm'], true),
  ('Woven Pendant Light',    'lighting',    9200,  '💡', 'New',        null, 0,   'percent', 'Handwoven rattan pendant with a warm Edison bulb. Creates beautiful dappled light patterns.', array['Handwoven rattan','E27 bulb socket','1.5m cable','Shade Ø: 35 cm'], true),
  ('Travertine Table Lamp',  'lighting',    7600,  '🪔', null,         null, 15,  'percent', 'Natural travertine stone base with a linen drum shade. Heavy, grounding, and timeless.', array['Natural travertine base','Linen drum shade','H: 45 cm'], true),
  ('Ceramic Vase — Sage',    'accessories', 2800,  '🏺', 'Bestseller', null, 0,   'percent', 'Wheel-thrown ceramic vase in a muted sage glaze. Each piece varies slightly — authentic handcraft.', array['Wheel-thrown ceramic','Reactive sage glaze','H: 22 cm'], true),
  ('Scented Candle Set',     'accessories', 2200,  '🕯️', 'New',        null, 200, 'flat',    'Set of 3 soy-wax candles in woody, floral, and citrus notes. Poured into matte ceramic vessels.', array['100% soy wax','40-hour burn time','3 fragrances'], true);

insert into delivery_zones (id, name, charge, is_local) values
  ('z1', 'Dhaka (Inside)',    60,  true),
  ('z2', 'Dhaka (Outside)',   100, false),
  ('z3', 'Chittagong',        120, false),
  ('z4', 'Sylhet',            120, false),
  ('z5', 'Rajshahi',          130, false),
  ('z6', 'Khulna',            130, false),
  ('z7', 'Rest of Bangladesh',150, false)
on conflict (id) do nothing;
