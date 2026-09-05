# VIVENTRA — deployment guide

A home-decor storefront (React + Vite) with a Supabase backend for products,
categories, delivery zones, orders, and admin auth. Cash on Delivery and
manual bKash work out of the box with zero external accounts. The online
payment gateway (SSLCommerz) is wired up but stays off until you drop in real
merchant credentials — see [Adding real online payments](#adding-real-online-payments-later) below.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), create a free account and a new project.
2. Open **SQL Editor** in the left sidebar, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all
   the tables and security rules.
3. (Optional) Also run [`supabase/seed.sql`](supabase/seed.sql) if you want to
   start from the original demo catalogue (8 sample products, 4 categories, 7
   delivery zones) instead of an empty store — you can edit or delete any of
   it from the admin panel afterward.
4. Go to **Authentication → Users → Add user** and create your own admin
   account (an email + password). This is what you'll log into the admin
   panel with — there's no separate "username/password" anymore, it's a real
   Supabase Auth account.
5. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon / public key**. You'll need both in the next step.

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and paste in your Project URL and anon key:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Then install dependencies and run it locally to confirm everything connects:

```bash
npm install
npm run dev
```

Open the printed local URL. The homepage should load your catalogue (or an
empty store if you skipped the seed data). To reach the admin panel, either:
- add `#vadmin-2024` to the end of the URL (the default secret — change it
  from **Account & Security** once you're in), or
- click the footer copyright text 5 times quickly.

Log in with the email/password you created in Supabase Authentication.

## 3. Deploy to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), **Add New Project**, and import
   that repository. Vercel auto-detects the Vite framework.
3. Before deploying, add the same two environment variables from your `.env`
   file under **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. You'll get a live `https://your-project.vercel.app` URL — that's
   your store.
5. Once you buy a domain, add it under the Vercel project's **Domains** tab
   and follow its DNS instructions.

Every push to your main branch redeploys automatically.

## How the admin panel works now

- **Categories, products, delivery zones, payment methods, the bKash
  number, Conditional COD, and the hidden-admin secret URL** are all stored
  in Supabase and shared by everyone who opens the site — changes an admin
  makes are immediately live for every visitor, and they survive refreshes
  and redeploys.
- **Orders** placed at checkout are saved to the `orders` table and show up
  in the new **Orders** tab in the admin panel, where you can update their
  status (Pending → Awaiting Verification → Verified → Shipped → Delivered,
  or Cancelled).
- **Admin login** is real Supabase Auth. Add more admins from Supabase's
  Authentication tab if more than one person needs access — anyone signed in
  counts as an admin (there's no separate roles system, matching the
  single-admin design of the original app).

## Payments today: COD + manual bKash

Both are fully functional with no setup:
- **Cash on Delivery** — customer pays on arrival. If **Conditional COD** is
  turned on (Payment Settings tab) and their delivery zone isn't marked
  *Local*, they're asked to pay just the delivery charge via bKash first.
- **bKash (Manual)** — customer sends payment to the number you set in
  Payment Settings and enters the transaction ID at checkout; the order
  lands in your Orders tab as "Awaiting Verification" until you confirm the
  payment actually arrived and mark it Verified.

## Adding real online payments later

The **Online Payment Gateway** option (SSLCommerz) is coded but inert until
you configure it — with it off (the default), customers only see COD and
manual bKash.

To activate it once you have a business ready to accept card/bKash/Nagad
payments online:

1. Apply for an SSLCommerz merchant account at
   [sslcommerz.com](https://sslcommerz.com) (needs a trade license and bank
   details), or get free sandbox credentials at
   [developer.sslcommerz.com](https://developer.sslcommerz.com) to test the
   flow first.
2. In Supabase, go to **Project Settings → API** and copy the
   **service_role** key (a secret — never put this in `.env` or commit it).
3. In your Vercel project, add these environment variables:
   - `SSLCOMMERZ_STORE_ID`
   - `SSLCOMMERZ_STORE_PASSWORD`
   - `SSLCOMMERZ_MODE` — `test` for sandbox, `live` once you're approved
   - `SUPABASE_SERVICE_ROLE_KEY` — the key from step 2
4. Redeploy. Turn on **Online Payment Gateway** in the admin's Payment
   Settings tab.

From then on, choosing that payment method at checkout creates a pending
order, sends the customer to SSLCommerz's real hosted payment page, and
their return trip (`api/ipn.js`) validates the transaction and marks the
order Verified automatically. If the keys are ever missing or the sandbox
call fails, checkout quietly falls back to a built-in demo card modal
instead of breaking — useful while you're still setting things up.

## A few honest limitations

- **Product images** are stored as base64 text directly in the database,
  same as the original app's in-memory version. That's fine for a catalogue
  of dozens of products; if you get into the hundreds with lots of photos,
  moving to Supabase Storage (actual file uploads) would be a worthwhile
  follow-up.
- **One admin role.** Anyone who can sign into your Supabase project's
  Authentication is treated as a full admin — there's no "staff vs owner"
  permission split.
- **No inventory/stock tracking, email receipts, or shipment tracking
  numbers** — the original app didn't have these either; they're natural
  next features once the store is live.
