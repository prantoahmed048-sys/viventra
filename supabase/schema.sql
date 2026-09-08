-- ============================================================================
-- VIVENTRA — production schema
-- Run this once in your Supabase project's SQL editor (Project > SQL Editor).
-- ============================================================================

-- ─── Categories ──────────────────────────────────────────────────────────────
create table if not exists categories (
  id         text primary key,
  name       text not null,
  icon       text not null default '🏷️',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Products ────────────────────────────────────────────────────────────────
create table if not exists products (
  id             bigint generated always as identity primary key,
  name           text not null,
  category       text not null references categories(id) on update cascade on delete restrict,
  price          numeric(12,2) not null default 0,
  emoji          text default '🛍️',
  image          text,                          -- data: URI or Supabase Storage URL (cover photo)
  images         text[] default '{}',           -- extra gallery photos, same format
  badge          text,
  discount       numeric(12,2) not null default 0,
  discount_type  text not null default 'percent' check (discount_type in ('percent','flat')),
  description    text default '',
  features       text[] default '{}',
  visible        boolean not null default true,
  stock          integer,                       -- null = not tracked (unlimited); a number = tracked
  free_delivery  boolean not null default false, -- true = waives the delivery charge for orders containing it
  created_at     timestamptz not null default now()
);

-- Atomically reduces a product's stock when an order is placed (called from
-- the server, which bypasses RLS). Never goes below 0, and leaves untracked
-- (null) products alone.
create or replace function decrement_product_stock(p_id bigint, qty integer)
returns void
language sql
as $$
  update products set stock = greatest(stock - qty, 0) where id = p_id and stock is not null;
$$;

-- ─── Delivery zones ──────────────────────────────────────────────────────────
create table if not exists delivery_zones (
  id         text primary key,
  name       text not null,
  charge     numeric(12,2) not null default 0,
  is_local   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Store settings (single row) ────────────────────────────────────────────
create table if not exists store_settings (
  id                 integer primary key default 1,
  bkash_number       text not null default '01700000000',
  conditional_cod    boolean not null default false,
  admin_hash_secret  text not null default 'vadmin-2024',
  gateway            jsonb not null default '{"provider":"sslcommerz","merchantId":"","apiKey":"","mode":"test","configured":false}'::jsonb,
  payments           jsonb not null default '[
    {"id":"cod","icon":"💵","name":"Cash on Delivery","desc":"Pay when your order arrives","enabled":true},
    {"id":"manual_bkash","icon":"📱","name":"bKash (Manual)","desc":"Send payment & submit transaction ID","enabled":true},
    {"id":"gateway","icon":"🔐","name":"Online Payment Gateway","desc":"Pay securely with card, bKash, Nagad","enabled":false},
    {"id":"card","icon":"💳","name":"Credit / Debit Card","desc":"Visa, Mastercard, AMEX","enabled":false},
    {"id":"bank","icon":"🏦","name":"Bank Transfer","desc":"Direct bank transfer","enabled":false}
  ]'::jsonb,
  constraint single_row check (id = 1)
);
insert into store_settings (id) values (1) on conflict (id) do nothing;

-- ─── Orders ──────────────────────────────────────────────────────────────────
create table if not exists orders (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  customer_name    text not null,
  address          text not null,
  phone            text not null,
  payment_method   text not null,
  txn_code         text,
  zone_id          text references delivery_zones(id) on delete set null,
  bkash_mode       text,
  items            jsonb not null,
  subtotal         numeric(12,2) not null,
  delivery_charge  numeric(12,2) not null default 0,
  total            numeric(12,2) not null,
  status           text not null default 'pending'
                   check (status in ('pending','pending_verification','verified','shipped','delivered','cancelled')),
  advance_paid     boolean not null default false
);

-- ============================================================================
-- Row Level Security
-- The storefront is public and anonymous; the admin panel signs in with
-- Supabase Auth (create the one admin user yourself in the Supabase dashboard —
-- Authentication > Users > Add user). Any signed-in user counts as admin,
-- since this app never exposes public sign-up.
-- ============================================================================
alter table categories      enable row level security;
alter table products        enable row level security;
alter table delivery_zones  enable row level security;
alter table store_settings  enable row level security;
alter table orders          enable row level security;

-- Catalog data: world-readable, admin-writable
create policy "public read categories"  on categories      for select using (true);
create policy "public read products"    on products        for select using (true);
create policy "public read zones"       on delivery_zones  for select using (true);
create policy "public read settings"    on store_settings  for select using (true);

create policy "admin write categories"  on categories      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write products"    on products        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write zones"       on delivery_zones  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write settings"    on store_settings  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Orders: any visitor can place one, only the admin can read or update them
create policy "public insert orders"    on orders for insert with check (true);
create policy "admin read orders"       on orders for select using (auth.role() = 'authenticated');
create policy "admin update orders"     on orders for update using (auth.role() = 'authenticated');
