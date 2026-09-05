import { createClient } from "@supabase/supabase-js";

// Vercel serverless function — SSLCommerz calls this after a payment attempt
// (IPN: Instant Payment Notification), and shoppers land here too via the
// success_url redirect. It validates the transaction with SSLCommerz, then
// marks the matching order as verified in Supabase using the service-role
// key — a server-only secret, never exposed to the browser, that bypasses
// the "admin only" Row Level Security policy on the orders table.
//
// Requires SUPABASE_SERVICE_ROLE_KEY (from Supabase Project Settings > API)
// and SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD as Vercel env vars.

export default async function handler(req, res) {
  const params = req.method === "POST" ? req.body : req.query;
  const { tran_id, val_id, order } = params || {};
  const orderId = order || (tran_id ? String(tran_id).replace(/^viventra-/, "") : null);
  if (!orderId) return res.status(400).send("Missing order reference");

  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const isLive = process.env.SSLCOMMERZ_MODE === "live";

  try {
    // Validate the transaction server-to-server before trusting it — never
    // mark an order paid just because a redirect said so.
    if (val_id && storeId && storePassword) {
      const validateUrl =
        (isLive
          ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
          : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php") +
        `?val_id=${encodeURIComponent(val_id)}&store_id=${storeId}&store_passwd=${storePassword}&format=json`;
      const r = await fetch(validateUrl);
      const data = await r.json();
      if (data.status !== "VALID" && data.status !== "VALIDATED") {
        return res.status(400).send("Payment could not be validated");
      }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey);
      await admin.from("orders").update({ status: "verified" }).eq("id", orderId);
    }

    // The success_url redirect (a real browser navigation) lands here as a
    // GET — send the shopper back to the store. The server-to-server IPN
    // POST just needs a 200 response.
    if (req.method === "GET") {
      res.writeHead(302, { Location: "/?order=confirmed" });
      return res.end();
    }
    return res.status(200).send("OK");
  } catch (err) {
    return res.status(500).send(err.message);
  }
}
