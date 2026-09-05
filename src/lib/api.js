import { supabase } from "./supabase.js";

// ─── Mapping helpers ─────────────────────────────────────────────────────────
// The DB uses snake_case columns; the app's existing state shape (kept as-is
// from the original component) uses camelCase. These convert both ways so the
// rest of App.jsx barely has to change.

const productFromRow = (r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  price: Number(r.price),
  emoji: r.emoji,
  badge: r.badge,
  image: r.image,
  discount: Number(r.discount),
  discountType: r.discount_type,
  desc: r.description,
  features: r.features || [],
  visible: r.visible,
});

const productToRow = (p) => ({
  name: p.name,
  category: p.category,
  price: Number(p.price) || 0,
  emoji: p.emoji || "🛍️",
  badge: p.badge || null,
  image: p.image || null,
  discount: Number(p.discount) || 0,
  discount_type: p.discountType || "percent",
  description: p.desc || "",
  features: Array.isArray(p.features)
    ? p.features
    : String(p.features || "").split("\n").map((s) => s.trim()).filter(Boolean),
  visible: p.visible !== false,
});

const zoneFromRow = (r) => ({ id: r.id, name: r.name, charge: Number(r.charge), isLocal: r.is_local });
const zoneToRow = (z) => ({ id: z.id, name: z.name, charge: Number(z.charge) || 0, is_local: !!z.isLocal });

// ─── Catalog: fetch everything the storefront + admin need in one go ─────────
export async function fetchCatalog() {
  const [{ data: categories, error: catErr }, { data: products, error: prodErr }, { data: zones, error: zoneErr }, { data: settings, error: setErr }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("products").select("*").order("created_at", { ascending: true }),
      supabase.from("delivery_zones").select("*").order("created_at", { ascending: true }),
      supabase.from("store_settings").select("*").eq("id", 1).single(),
    ]);
  const firstError = catErr || prodErr || zoneErr || setErr;
  if (firstError) throw firstError;
  return {
    categories: (categories || []).map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    products: (products || []).map(productFromRow),
    zones: (zones || []).map(zoneFromRow),
    settings: {
      bkashNumber: settings.bkash_number,
      conditionalCod: settings.conditional_cod,
      adminHashSecret: settings.admin_hash_secret,
      gateway: settings.gateway,
      payments: settings.payments,
    },
  };
}

// ─── Categories ──────────────────────────────────────────────────────────────
export async function insertCategory({ id, name, icon }) {
  const { error } = await supabase.from("categories").insert({ id, name, icon });
  if (error) throw error;
}
export async function updateCategoryRow(id, { name, icon }) {
  const { error } = await supabase.from("categories").update({ name, icon }).eq("id", id);
  if (error) throw error;
}
export async function deleteCategoryRow(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ─── Products ────────────────────────────────────────────────────────────────
export async function insertProduct(p) {
  const { data, error } = await supabase.from("products").insert(productToRow(p)).select().single();
  if (error) throw error;
  return productFromRow(data);
}
export async function updateProductRow(id, p) {
  const { error } = await supabase.from("products").update(productToRow(p)).eq("id", id);
  if (error) throw error;
}
export async function deleteProductRow(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ─── Delivery zones ──────────────────────────────────────────────────────────
export async function insertZone(z) {
  const { error } = await supabase.from("delivery_zones").insert(zoneToRow(z));
  if (error) throw error;
}
export async function updateZoneRow(id, patch) {
  const row = {};
  if ("name" in patch) row.name = patch.name;
  if ("charge" in patch) row.charge = Number(patch.charge) || 0;
  if ("isLocal" in patch) row.is_local = !!patch.isLocal;
  const { error } = await supabase.from("delivery_zones").update(row).eq("id", id);
  if (error) throw error;
}
export async function deleteZoneRow(id) {
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  if (error) throw error;
}

// ─── Store settings (single row, id=1) ───────────────────────────────────────
export async function updateSettingsRow(patch) {
  const row = {};
  if ("bkashNumber" in patch) row.bkash_number = patch.bkashNumber;
  if ("conditionalCod" in patch) row.conditional_cod = patch.conditionalCod;
  if ("adminHashSecret" in patch) row.admin_hash_secret = patch.adminHashSecret;
  if ("gateway" in patch) row.gateway = patch.gateway;
  if ("payments" in patch) row.payments = patch.payments;
  const { error } = await supabase.from("store_settings").update(row).eq("id", 1);
  if (error) throw error;
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export async function insertOrder(order) {
  const row = {
    customer_name: order.name,
    address: order.address,
    phone: order.phone,
    payment_method: order.payment,
    txn_code: order.txnCode || null,
    zone_id: order.zoneId || null,
    bkash_mode: order.bkashMode || null,
    items: order.items,
    subtotal: order.subtotal,
    delivery_charge: order.deliveryCharge,
    total: order.total,
    status: order.status || "pending",
    advance_paid: !!order.advancePaid,
  };
  const { data, error } = await supabase.from("orders").insert(row).select().single();
  if (error) throw error;
  return data;
}
export async function fetchOrders() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function updateOrderStatusRow(id, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}
export async function signOut() {
  await supabase.auth.signOut();
}
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return data.subscription;
}
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
export async function updateEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}
