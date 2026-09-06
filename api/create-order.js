import { createClient } from "@supabase/supabase-js";

// Vercel serverless function — creates an order using the Supabase
// service-role key (a server-only secret that bypasses Row Level Security).
//
// Why this exists: writing the order directly from the browser using the
// public anon key works in normal browsers, but Facebook/Instagram's
// built-in in-app browser (what customers land in after tapping a Meta ad)
// is known to mangle that particular kind of cross-origin request, causing
// checkout to fail with a row-level-security error. A plain same-origin
// POST to our own /api route like this one doesn't hit that problem, so
// checkout works everywhere — including inside Facebook's browser.
//
// Requires SUPABASE_SERVICE_ROLE_KEY (Supabase dashboard > Project Settings
// > API > service_role — NOT the anon key) set as a Vercel environment
// variable. If it's missing, this responds 501 and the app automatically
// falls back to the old direct-insert method instead of breaking checkout.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(501).json({ error: "Server-side order creation is not configured yet." });
  }

  const row = req.body || {};
  const required = ["customer_name", "address", "phone", "payment_method", "items", "subtotal", "total"];
  for (const field of required) {
    if (row[field] === undefined || row[field] === null || row[field] === "") {
      return res.status(400).json({ error: `Missing field: ${field}` });
    }
  }

  try {
    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin
      .from("orders")
      .insert({
        customer_name: row.customer_name,
        address: row.address,
        phone: row.phone,
        payment_method: row.payment_method,
        txn_code: row.txn_code || null,
        zone_id: row.zone_id || null,
        bkash_mode: row.bkash_mode || null,
        items: row.items,
        subtotal: row.subtotal,
        delivery_charge: row.delivery_charge || 0,
        total: row.total,
        status: row.status || "pending",
        advance_paid: !!row.advance_paid,
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ order: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Could not save order" });
  }
}
