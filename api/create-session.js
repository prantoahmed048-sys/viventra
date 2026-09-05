// Vercel serverless function — creates an SSLCommerz payment session.
//
// Inactive until SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD are set as
// environment variables on your Vercel project (Project Settings >
// Environment Variables). Until then this returns 501 and the storefront
// falls back to a demo checkout modal, so nothing breaks in the meantime.
//
// Get sandbox credentials at https://developer.sslcommerz.com (free, instant)
// to test this end-to-end before applying for a live merchant account.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePassword) {
    return res.status(501).json({ configured: false, error: "SSLCommerz is not configured on the server yet." });
  }

  const { orderId, amount, customerName, customerPhone, customerAddress } = req.body || {};
  if (!orderId || !amount) {
    return res.status(400).json({ error: "orderId and amount are required" });
  }

  const isLive = process.env.SSLCOMMERZ_MODE === "live";
  const apiUrl = isLive
    ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
    : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const params = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: String(amount),
    currency: "BDT",
    tran_id: `viventra-${orderId}`,
    success_url: `${origin}/api/ipn?order=${orderId}`,
    fail_url: `${origin}/checkout?payment=failed`,
    cancel_url: `${origin}/checkout?payment=cancelled`,
    ipn_url: `${origin}/api/ipn`,
    cus_name: customerName || "Customer",
    cus_email: "customer@viventra.shop",
    cus_add1: customerAddress || "Bangladesh",
    cus_phone: customerPhone || "01700000000",
    shipping_method: "Courier",
    product_name: "VIVENTRA order",
    product_category: "Home Decor",
    product_profile: "general",
  });

  try {
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await r.json();
    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      return res.status(200).json({ configured: true, redirectUrl: data.GatewayPageURL });
    }
    return res.status(502).json({ configured: true, error: data.failedreason || "SSLCommerz session could not be created" });
  } catch (err) {
    return res.status(502).json({ configured: true, error: err.message });
  }
}
