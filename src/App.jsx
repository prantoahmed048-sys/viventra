import { useState, useRef, useEffect } from "react";
import * as api from "./lib/api.js";

// ─── Brand Assets ────────────────────────────────────────────────────────────
// The official Viventra logo and lifestyle cover photo, served as static
// files from /public (see logo.jpg / cover.jpg) instead of being embedded as
// base64 text — that used to bloat the JS bundle and slow first load,
// especially on slower mobile connections.
const LOGO_BADGE = "/logo.jpg";
const COVER_PHOTO = "/cover.jpg";

// Google reCAPTCHA (v2 checkbox) site key — shown at checkout to block bot /
// fake orders. This key is meant to be public (it's embedded in every page
// that uses reCAPTCHA); the matching secret key lives only on Vercel as the
// RECAPTCHA_SECRET_KEY environment variable, never in this file.
const RECAPTCHA_SITE_KEY = "6LfEs7AtAAAAADDCKm-ei4r0uNyUZlkV1Ky-nrTu";


// ─── Palette & Fonts ───────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

  :root {
    --linen: #F7F3EE;
    --linen2: #EDE8E0;
    --terra: #C4714A;
    --terra-dark: #A55A35;
    --sage: #7A9E7E;
    --sage-dark: #5C8060;
    --gold: #C4963C;
    --brown: #3D2B1F;
    --brown-light: #7A5C45;
    --muted: #A89070;
    --white: #FDFAF6;
    --card: #FFFFFF;
    --shadow: 0 4px 24px rgba(61,43,31,0.08);
    --shadow-lg: 0 12px 48px rgba(61,43,31,0.14);
    --radius: 12px;
    --radius-sm: 6px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Jost', sans-serif; background: var(--linen); color: var(--brown); min-height: 100vh; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--linen); }
  ::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 3px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .fade-up { animation: fadeUp 0.5s ease both; }
  .fade-in { animation: fadeIn 0.4s ease both; }

  .nav { position:sticky; top:0; z-index:100; background:rgba(247,243,238,0.92); backdrop-filter:blur(12px); border-bottom:1px solid var(--linen2); padding:0 32px; display:flex; align-items:center; justify-content:space-between; height:68px; }
  .nav-logo { display:flex; align-items:center; gap:10px; cursor:pointer; }
  .nav-logo-text { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; color:var(--brown); letter-spacing:2px; }
  .nav-logo-sub { font-size:9px; letter-spacing:3px; color:var(--muted); text-transform:uppercase; }
  .nav-links { display:flex; gap:28px; align-items:center; }
  .nav-link { font-size:13px; font-weight:500; letter-spacing:1px; color:var(--brown-light); cursor:pointer; text-transform:uppercase; transition:color 0.2s; border:none; background:none; padding:4px 0; }
  .nav-link:hover { color:var(--terra); }
  .nav-link.active { color:var(--terra); border-bottom:1px solid var(--terra); }
  .nav-cart-btn { display:flex; align-items:center; gap:6px; background:var(--terra); color:white; border:none; border-radius:50px; padding:8px 16px; font-family:'Jost',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:background 0.2s; }
  .nav-cart-btn:hover { background:var(--terra-dark); }
  .badge { background:var(--gold); color:white; border-radius:50%; width:18px; height:18px; font-size:10px; display:flex; align-items:center; justify-content:center; font-weight:600; }

  .hero { min-height:88vh; background:linear-gradient(135deg,#F2EDE4 0%,#E9DFD1 45%,#EFE7D9 100%); display:flex; align-items:center; position:relative; overflow:hidden; padding:60px 32px; }
  .hero::before { content:''; position:absolute; top:-80px; right:-80px; width:560px; height:560px; border-radius:50%; background:radial-gradient(circle,rgba(196,113,74,0.13) 0%,transparent 70%); }
  .hero::after { content:''; position:absolute; bottom:-120px; left:8%; width:340px; height:340px; border-radius:50%; background:radial-gradient(circle,rgba(122,158,126,0.14) 0%,transparent 70%); }
  .hero-content { max-width:560px; position:relative; z-index:1; }
  .hero-eyebrow { font-size:11px; letter-spacing:4px; color:var(--terra); text-transform:uppercase; font-weight:500; margin-bottom:20px; }
  .hero-title { font-family:'Cormorant Garamond',serif; font-size:clamp(48px,6vw,76px); font-weight:300; line-height:1.1; color:var(--brown); margin-bottom:24px; }
  .hero-title em { font-style:italic; color:var(--terra); }
  .hero-desc { font-size:15px; color:var(--brown-light); line-height:1.8; margin-bottom:40px; font-weight:300; }
  .hero-btns { display:flex; gap:16px; flex-wrap:wrap; }
  .btn-primary { background:var(--terra); color:white; border:none; padding:14px 32px; border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:500; letter-spacing:1px; cursor:pointer; transition:all 0.25s; text-transform:uppercase; }
  .btn-primary:hover { background:var(--terra-dark); transform:translateY(-2px); box-shadow:0 8px 24px rgba(196,113,74,0.3); }
  .btn-secondary { background:transparent; color:var(--brown); border:1.5px solid var(--brown-light); padding:14px 32px; border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:500; letter-spacing:1px; cursor:pointer; transition:all 0.25s; text-transform:uppercase; }
  .btn-secondary:hover { border-color:var(--terra); color:var(--terra); transform:translateY(-2px); }
  .hero-visual { position:absolute; right:0; top:0; bottom:0; width:45%; display:flex; align-items:center; justify-content:center; }
  .hero-mosaic { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:40px; transform:rotate(-3deg); }
  .hero-tile { border-radius:12px; overflow:hidden; box-shadow:0 8px 32px rgba(61,43,31,0.15); }
  .hero-tile:nth-child(2) { margin-top:24px; }
  .hero-tile:nth-child(3) { margin-top:-24px; }

  .section { padding:80px 32px; }
  .section-header { text-align:center; margin-bottom:56px; }
  .section-label { font-size:11px; letter-spacing:4px; text-transform:uppercase; color:var(--terra); font-weight:500; margin-bottom:12px; }
  .section-title { font-family:'Cormorant Garamond',serif; font-size:clamp(32px,4vw,48px); font-weight:300; color:var(--brown); }
  .section-divider { width:40px; height:2px; background:var(--gold); margin:16px auto 0; }

  .categories-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px; max-width:1100px; margin:0 auto; }
  .category-card { background:var(--card); border-radius:var(--radius); padding:32px 24px; text-align:center; cursor:pointer; transition:all 0.3s; box-shadow:var(--shadow); border:1px solid transparent; position:relative; overflow:hidden; }
  .category-card::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity 0.3s; background:linear-gradient(135deg,rgba(196,113,74,0.06),rgba(122,158,126,0.06)); }
  .category-card:hover { transform:translateY(-6px); box-shadow:var(--shadow-lg); border-color:var(--terra); }
  .category-card:hover::before { opacity:1; }
  .cat-icon { font-size:36px; margin-bottom:16px; }
  .cat-name { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600; color:var(--brown); margin-bottom:6px; }
  .cat-count { font-size:12px; color:var(--muted); letter-spacing:1px; }

  .products-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:24px; max-width:1200px; margin:0 auto; }
  .product-card { background:var(--card); border-radius:var(--radius); overflow:hidden; cursor:pointer; transition:all 0.3s; box-shadow:var(--shadow); }
  .product-card:hover { transform:translateY(-6px); box-shadow:var(--shadow-lg); }
  .product-card:hover .product-img-inner { transform:scale(1.05); }
  .product-img-wrap { height:220px; overflow:hidden; position:relative; }
  .product-img-inner { width:100%; height:100%; transition:transform 0.5s ease; display:flex; align-items:center; justify-content:center; font-size:60px; }
  .product-img-inner img { width:100%; height:100%; object-fit:cover; }
  .product-badge { position:absolute; top:12px; left:12px; background:var(--terra); color:white; font-size:10px; letter-spacing:1px; padding:4px 10px; border-radius:20px; text-transform:uppercase; font-weight:500; }
  .product-info { padding:20px; }
  .product-cat { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .product-name { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600; color:var(--brown); margin-bottom:8px; line-height:1.3; }
  .product-desc-short { font-size:13px; color:var(--brown-light); line-height:1.6; margin-bottom:12px; }
  .product-footer { display:flex; align-items:center; justify-content:space-between; }
  .product-price { font-size:18px; font-weight:600; color:var(--terra); }
  .product-price span { font-size:11px; font-weight:400; color:var(--muted); }
  .add-btn { background:var(--brown); color:white; border:none; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:20px; transition:all 0.2s; display:flex; align-items:center; justify-content:center; }
  .add-btn:hover { background:var(--terra); transform:rotate(90deg); }

  /* SALE / DISCOUNT */
  .sale-badge { position:absolute; top:12px; right:12px; background:#E8384F; color:white; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; letter-spacing:0.5px; }
  .price-block { display:flex; flex-direction:column; gap:2px; }
  .price-original { font-size:12px; color:var(--muted); text-decoration:line-through; font-weight:400; }
  .price-final { font-size:18px; font-weight:700; color:#E8384F; }
  .price-final.no-discount { color:var(--terra); font-weight:600; }
  .detail-price-block { margin-bottom:24px; }
  .detail-price-original { font-size:16px; color:var(--muted); text-decoration:line-through; margin-bottom:4px; }
  .detail-price-final { font-size:32px; font-weight:700; color:#E8384F; }
  .detail-price-final.no-discount { color:var(--terra); font-size:28px; font-weight:600; }
  .detail-savings-tag { display:inline-block; background:rgba(232,56,79,0.1); color:#E8384F; font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; margin-top:6px; }

  /* ADMIN DISCOUNT FORM */
  .discount-row { display:grid; grid-template-columns:120px 1fr; gap:10px; align-items:end; }
  .discount-preview { margin-top:10px; background:rgba(232,56,79,0.07); border:1px solid rgba(232,56,79,0.2); border-radius:var(--radius-sm); padding:10px 14px; font-size:13px; color:#E8384F; font-weight:500; display:flex; align-items:center; gap:8px; }
  .tbl-discount { font-size:11px; font-weight:600; color:#E8384F; background:rgba(232,56,79,0.1); padding:2px 8px; border-radius:12px; }

  .product-detail { max-width:1100px; margin:0 auto; padding:40px 32px; display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:start; }
  .detail-img-container { position:relative; border-radius:var(--radius); overflow:hidden; aspect-ratio:1; background:var(--linen2); display:flex; align-items:center; justify-content:center; }
  .detail-img-emoji { font-size:120px; }
  .detail-img-photo { width:100%; height:100%; object-fit:cover; }
  .zoom-preview { position:absolute; right:-240px; top:0; width:220px; height:220px; border-radius:var(--radius); box-shadow:var(--shadow-lg); overflow:hidden; background:var(--linen); border:1px solid var(--linen2); display:none; align-items:center; justify-content:center; font-size:48px; z-index:10; }
  .detail-img-container:hover .zoom-preview { display:flex; }
  .zoom-hint { position:absolute; right:12px; bottom:12px; background:rgba(0,0,0,0.55); color:white; font-size:11px; padding:5px 10px; border-radius:20px; pointer-events:none; letter-spacing:0.3px; }
  .lightbox-overlay { position:fixed; inset:0; background:rgba(20,15,10,0.92); z-index:1000; display:flex; align-items:center; justify-content:center; padding:40px; cursor:zoom-out; }
  .lightbox-img { max-width:100%; max-height:100%; object-fit:contain; border-radius:8px; cursor:default; }
  .lightbox-close { position:absolute; top:20px; right:24px; background:rgba(255,255,255,0.12); color:white; border:none; width:40px; height:40px; border-radius:50%; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .lightbox-nav { position:absolute; top:50%; transform:translateY(-50%); background:rgba(255,255,255,0.12); color:white; border:none; width:48px; height:48px; border-radius:50%; font-size:26px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .lightbox-prev { left:20px; }
  .lightbox-next { right:20px; }
  @media (max-width:640px) { .lightbox-overlay { padding:16px; } .lightbox-nav { width:40px; height:40px; font-size:20px; } }
  .detail-eyebrow { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--muted); margin-bottom:12px; }
  .detail-title { font-family:'Cormorant Garamond',serif; font-size:40px; font-weight:400; color:var(--brown); margin-bottom:16px; line-height:1.2; }
  .detail-price { font-size:28px; font-weight:600; color:var(--terra); margin-bottom:24px; }
  .detail-divider { height:1px; background:var(--linen2); margin:24px 0; }
  .detail-desc { font-size:14px; color:var(--brown-light); line-height:1.9; margin-bottom:32px; }
  .detail-features { margin-bottom:32px; }
  .detail-feature { display:flex; gap:10px; margin-bottom:10px; font-size:13px; color:var(--brown-light); }
  .feature-dot { color:var(--terra); font-size:16px; flex-shrink:0; }
  .qty-row { display:flex; align-items:center; gap:16px; margin-bottom:24px; }
  .qty-label { font-size:13px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; }
  .qty-control { display:flex; align-items:center; border:1px solid var(--linen2); border-radius:50px; overflow:hidden; }
  .qty-btn { background:none; border:none; width:36px; height:36px; cursor:pointer; font-size:16px; color:var(--brown); transition:background 0.2s; }
  .qty-btn:hover { background:var(--linen2); }
  .qty-num { padding:0 16px; font-size:15px; font-weight:500; }
  .detail-btn-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .detail-add-btn { width:100%; padding:16px; background:var(--linen2); color:var(--brown); border:1.5px solid var(--linen2); border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; cursor:pointer; transition:all 0.25s; text-transform:uppercase; }
  .detail-add-btn:hover { background:var(--linen); border-color:var(--brown-light); box-shadow:0 4px 16px rgba(61,43,31,0.1); }
  .detail-buy-btn { width:100%; padding:16px; background:var(--terra); color:white; border:none; border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; cursor:pointer; transition:all 0.25s; text-transform:uppercase; }
  .detail-buy-btn:hover { background:var(--terra-dark); box-shadow:0 8px 24px rgba(196,113,74,0.4); transform:translateY(-1px); }

  .page-container { max-width:1000px; margin:0 auto; padding:48px 32px; }
  .page-title { font-family:'Cormorant Garamond',serif; font-size:40px; font-weight:300; color:var(--brown); margin-bottom:40px; }
  .cart-layout { display:grid; grid-template-columns:1fr 340px; gap:40px; }
  .cart-item { display:flex; gap:20px; align-items:center; background:var(--card); border-radius:var(--radius); padding:20px; margin-bottom:16px; box-shadow:var(--shadow); }
  .cart-item-thumb { width:80px; height:80px; background:var(--linen); border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; font-size:40px; }
  .cart-item-thumb img { width:100%; height:100%; object-fit:cover; }
  .cart-item-info { flex:1; }
  .cart-item-name { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:600; color:var(--brown); margin-bottom:4px; }
  .cart-item-cat { font-size:11px; color:var(--muted); letter-spacing:1px; margin-bottom:10px; text-transform:uppercase; }
  .cart-item-price { font-size:16px; font-weight:600; color:var(--terra); }
  .cart-item-remove { background:none; border:none; cursor:pointer; color:var(--muted); font-size:18px; transition:color 0.2s; }
  .cart-item-remove:hover { color:var(--terra); }
  .order-summary { background:var(--card); border-radius:var(--radius); padding:28px; box-shadow:var(--shadow); position:sticky; top:88px; }
  .summary-title { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; margin-bottom:24px; color:var(--brown); }
  .summary-row { display:flex; justify-content:space-between; font-size:14px; color:var(--brown-light); margin-bottom:12px; }
  .summary-row.total { font-size:17px; font-weight:600; color:var(--brown); border-top:1px solid var(--linen2); padding-top:16px; margin-top:16px; }
  .checkout-btn { width:100%; padding:15px; background:var(--terra); color:white; border:none; border-radius:50px; font-family:'Jost',sans-serif; font-size:14px; font-weight:500; letter-spacing:1px; cursor:pointer; transition:all 0.25s; margin-top:20px; text-transform:uppercase; }
  .checkout-btn:hover { background:var(--terra-dark); }
  .empty-state { text-align:center; padding:80px 20px; }
  .empty-icon { font-size:64px; margin-bottom:20px; }
  .empty-text { font-family:'Cormorant Garamond',serif; font-size:24px; color:var(--brown-light); margin-bottom:16px; }

  .checkout-grid { display:grid; grid-template-columns:1fr 340px; gap:40px; }
  .form-section { background:var(--card); border-radius:var(--radius); padding:32px; box-shadow:var(--shadow); }
  .form-section-title { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; margin-bottom:24px; color:var(--brown); }
  .form-group { margin-bottom:20px; }
  .form-label { display:block; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
  .form-input { width:100%; padding:12px 16px; border:1.5px solid var(--linen2); border-radius:var(--radius-sm); font-family:'Jost',sans-serif; font-size:14px; color:var(--brown); background:var(--linen); transition:border-color 0.2s; outline:none; }
  .form-input:focus { border-color:var(--terra); }
  .form-textarea { resize:vertical; min-height:100px; }
  .payment-options { display:grid; gap:12px; margin-top:8px; }
  .payment-option { display:flex; align-items:center; gap:14px; padding:14px 16px; border:1.5px solid var(--linen2); border-radius:var(--radius-sm); cursor:pointer; transition:all 0.2s; background:var(--linen); }
  .payment-option.selected { border-color:var(--terra); background:rgba(196,113,74,0.05); }
  .payment-option input { accent-color:var(--terra); }
  .payment-icon { font-size:20px; }
  .payment-label { font-size:14px; font-weight:500; color:var(--brown); }

  .bkash-panel { background:rgba(232,90,128,0.06); border:1.5px solid rgba(232,90,128,0.25); border-radius:var(--radius-sm); padding:20px; margin-top:16px; animation:fadeIn 0.3s ease; }
  .bkash-panel-title { font-size:14px; font-weight:600; color:#c0395a; margin-bottom:12px; }
  .bkash-mode-tabs { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1.5px solid rgba(232,90,128,0.3); border-radius:var(--radius-sm); overflow:hidden; margin-bottom:16px; }
  .bkash-mode-tab { padding:10px 14px; font-family:'Jost',sans-serif; font-size:12px; font-weight:500; text-align:center; cursor:pointer; border:none; background:white; color:var(--brown-light); transition:all 0.2s; line-height:1.4; }
  .bkash-mode-tab:first-child { border-right:1px solid rgba(232,90,128,0.2); }
  .bkash-mode-tab.active { background:#c0395a; color:white; }
  .bkash-mode-tab:hover:not(.active) { background:rgba(232,90,128,0.08); }
  .partial-info-box { background:rgba(122,158,126,0.1); border:1.5px solid rgba(122,158,126,0.3); border-radius:var(--radius-sm); padding:14px 16px; margin-bottom:14px; font-size:12px; color:var(--brown-light); line-height:1.7; }
  .partial-info-box strong { color:var(--sage-dark); }
  .partial-amount-split { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
  .split-card { border-radius:var(--radius-sm); padding:12px 14px; text-align:center; }
  .split-card.bkash-part { background:rgba(232,90,128,0.08); border:1px solid rgba(232,90,128,0.2); }
  .split-card.cod-part { background:rgba(122,158,126,0.08); border:1px solid rgba(122,158,126,0.2); }
  .split-label { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; font-weight:500; margin-bottom:4px; }
  .split-card.bkash-part .split-label { color:#c0395a; }
  .split-card.cod-part .split-label { color:var(--sage-dark); }
  .split-amount { font-size:18px; font-weight:700; }
  .split-card.bkash-part .split-amount { color:#c0395a; }
  .split-card.cod-part .split-amount { color:var(--sage-dark); }
  .split-desc { font-size:10px; color:var(--muted); margin-top:2px; }
  .bkash-number-row { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .bkash-number-box { flex:1; background:white; border:2px dashed rgba(232,90,128,0.4); border-radius:var(--radius-sm); padding:14px; font-size:22px; font-weight:700; color:#c0395a; text-align:center; letter-spacing:3px; margin-bottom:0; }
  .bkash-copy-btn { flex-shrink:0; background:#c0395a; color:white; border:none; border-radius:var(--radius-sm); padding:0 14px; height:52px; font-family:'Jost',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; letter-spacing:0.5px; }
  .bkash-copy-btn:hover { background:#a02e4a; transform:translateY(-1px); }
  .bkash-copy-btn.copied { background:var(--sage-dark); }
  .copy-icon { font-size:16px; }
  .bkash-steps { list-style:none; margin-bottom:0; }
  .bkash-steps li { font-size:12px; color:var(--brown-light); padding:4px 0; display:flex; gap:8px; line-height:1.5; }
  .bkash-steps li::before { content:"→"; color:#c0395a; flex-shrink:0; }
  .txn-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#c0395a; display:block; margin-top:16px; margin-bottom:8px; }
  .txn-input { width:100%; padding:12px 16px; border:1.5px solid rgba(232,90,128,0.4); border-radius:var(--radius-sm); font-family:'Jost',sans-serif; font-size:15px; font-weight:600; color:var(--brown); background:white; outline:none; letter-spacing:1px; }
  .txn-input:focus { border-color:#c0395a; box-shadow:0 0 0 3px rgba(192,57,90,0.1); }
  .txn-input::placeholder { font-weight:400; letter-spacing:0; font-size:13px; color:var(--muted); }

  .place-order-btn { width:100%; padding:16px; background:var(--sage); color:white; border:none; border-radius:50px; font-family:'Jost',sans-serif; font-size:14px; font-weight:500; letter-spacing:1px; cursor:pointer; transition:all 0.25s; margin-top:24px; text-transform:uppercase; }
  .place-order-btn:hover { background:var(--sage-dark); }

  .success-page { text-align:center; padding:100px 32px; max-width:600px; margin:0 auto; }
  .success-icon { font-size:80px; margin-bottom:24px; animation:fadeUp 0.6s ease; }
  .success-title { font-family:'Cormorant Garamond',serif; font-size:44px; font-weight:300; color:var(--brown); margin-bottom:16px; }
  .success-text { font-size:15px; color:var(--brown-light); line-height:1.8; margin-bottom:40px; }

  .admin-login { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--brown); }
  .admin-login-card { background:var(--white); border-radius:var(--radius); padding:48px; width:400px; box-shadow:0 24px 80px rgba(0,0,0,0.3); }
  .admin-login-logo { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:600; color:var(--brown); letter-spacing:3px; margin-bottom:6px; text-align:center; }
  .admin-login-sub { font-size:11px; letter-spacing:3px; color:var(--muted); text-transform:uppercase; margin-bottom:36px; text-align:center; }
  .login-btn { width:100%; padding:14px; background:var(--terra); color:white; border:none; border-radius:50px; font-family:'Jost',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:background 0.2s; margin-top:8px; }
  .login-btn:hover { background:var(--terra-dark); }
  .login-error { color:#e55; font-size:13px; margin-top:12px; text-align:center; }

  .admin-layout { display:grid; grid-template-columns:220px 1fr; min-height:100vh; }
  .admin-sidebar { background:var(--brown); }
  .admin-brand { padding:28px 24px; border-bottom:1px solid rgba(255,255,255,0.1); }
  .admin-brand-name { font-family:'Cormorant Garamond',serif; font-size:20px; color:white; letter-spacing:2px; }
  .admin-brand-sub { font-size:10px; color:rgba(255,255,255,0.5); letter-spacing:2px; margin-top:2px; }
  .admin-nav { padding:24px 0; }
  .admin-nav-item { display:flex; align-items:center; gap:12px; padding:12px 24px; color:rgba(255,255,255,0.65); font-size:13px; font-weight:500; cursor:pointer; transition:all 0.2s; border:none; background:none; width:100%; text-align:left; letter-spacing:0.5px; }
  .admin-nav-item:hover { background:rgba(255,255,255,0.08); color:white; }
  .admin-nav-item.active { background:rgba(196,113,74,0.25); color:var(--terra); border-right:3px solid var(--terra); }
  .admin-content { background:var(--linen); padding:40px; overflow-y:auto; }
  .admin-header { margin-bottom:36px; }
  .admin-title { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:400; color:var(--brown); }
  .admin-subtitle { font-size:13px; color:var(--muted); margin-top:4px; }

  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:36px; }
  .stat-card { background:var(--card); border-radius:var(--radius); padding:24px; box-shadow:var(--shadow); }
  .stat-icon { font-size:28px; margin-bottom:12px; }
  .stat-value { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:600; color:var(--brown); }
  .stat-label { font-size:12px; color:var(--muted); margin-top:4px; }

  .admin-card { background:var(--card); border-radius:var(--radius); padding:28px; box-shadow:var(--shadow); margin-bottom:24px; }
  .admin-card-title { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600; color:var(--brown); margin-bottom:20px; }
  .admin-table { width:100%; border-collapse:collapse; }
  .admin-table th { text-align:left; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); padding:0 12px 12px; border-bottom:1px solid var(--linen2); }
  .admin-table td { padding:14px 12px; border-bottom:1px solid var(--linen2); font-size:13px; color:var(--brown); vertical-align:middle; }
  .admin-table tr:last-child td { border-bottom:none; }
  .admin-table tr:hover td { background:var(--linen); }
  .tbl-thumb { width:44px; height:44px; border-radius:8px; background:var(--linen2); display:flex; align-items:center; justify-content:center; font-size:22px; overflow:hidden; flex-shrink:0; }
  .tbl-thumb img { width:100%; height:100%; object-fit:cover; }
  .tbl-name { font-weight:500; }
  .tbl-price { color:var(--terra); font-weight:600; }
  .tbl-badge { display:inline-block; font-size:10px; padding:3px 10px; border-radius:20px; letter-spacing:0.5px; font-weight:500; }
  .tbl-badge.active { background:rgba(122,158,126,0.15); color:var(--sage-dark); }
  .tbl-badge.inactive { background:rgba(168,144,112,0.15); color:var(--muted); }
  .action-btn { background:none; border:1px solid var(--linen2); border-radius:var(--radius-sm); padding:5px 12px; font-family:'Jost',sans-serif; font-size:12px; cursor:pointer; color:var(--brown); transition:all 0.2s; margin-right:6px; }
  .action-btn:hover { border-color:var(--terra); color:var(--terra); }
  .action-btn.danger:hover { border-color:#e55; color:#e55; }

  .add-product-form { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .add-product-form .full { grid-column:1/-1; }
  .form-select { width:100%; padding:12px 16px; border:1.5px solid var(--linen2); border-radius:var(--radius-sm); font-family:'Jost',sans-serif; font-size:14px; color:var(--brown); background:var(--linen); outline:none; cursor:pointer; }
  .form-select:focus { border-color:var(--terra); }
  .save-btn { background:var(--terra); color:white; border:none; padding:12px 28px; border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:background 0.2s; }
  .save-btn:hover { background:var(--terra-dark); }

  /* IMAGE UPLOAD */
  .img-upload-area { border:2px dashed var(--linen2); border-radius:var(--radius-sm); padding:32px 20px; text-align:center; cursor:pointer; transition:all 0.2s; background:var(--linen); position:relative; min-height:140px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .img-upload-area:hover { border-color:var(--terra); background:rgba(196,113,74,0.03); }
  .img-upload-area.filled { padding:0; border-style:solid; border-color:var(--sage); overflow:hidden; }
  .img-preview { width:100%; height:200px; object-fit:cover; display:block; }
  .img-overlay { position:absolute; bottom:0; left:0; right:0; background:rgba(61,43,31,0.7); padding:10px; display:flex; justify-content:center; gap:10px; }
  .img-overlay-btn { background:white; border:none; border-radius:20px; padding:5px 14px; font-size:12px; cursor:pointer; font-family:'Jost',sans-serif; color:var(--brown); }
  .img-upload-icon { font-size:36px; margin-bottom:10px; color:var(--muted); }
  .img-upload-text { font-size:14px; color:var(--brown-light); font-weight:500; }
  .img-upload-hint { font-size:11px; color:var(--muted); margin-top:4px; }

  /* PAYMENT SETTINGS */
  .toggle-switch { position:relative; display:inline-block; width:44px; height:24px; }
  .toggle-switch input { opacity:0; width:0; height:0; }
  .toggle-slider { position:absolute; cursor:pointer; inset:0; background:#ccc; border-radius:24px; transition:0.3s; }
  .toggle-slider:before { content:''; position:absolute; height:18px; width:18px; left:3px; bottom:3px; background:white; border-radius:50%; transition:0.3s; }
  input:checked + .toggle-slider { background:var(--terra); }
  input:checked + .toggle-slider:before { transform:translateX(20px); }
  .payment-method-row { display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-bottom:1px solid var(--linen2); }
  .payment-method-row:last-child { border-bottom:none; }
  .pm-info { display:flex; align-items:center; gap:12px; }
  .pm-icon { font-size:24px; }
  .pm-name { font-size:14px; font-weight:500; color:var(--brown); }
  .pm-desc { font-size:12px; color:var(--muted); }

  /* BKASH NUMBER ADMIN SETTING */
  .bkash-config-box { margin-top:28px; padding:24px; background:rgba(232,90,128,0.05); border:1.5px solid rgba(232,90,128,0.2); border-radius:var(--radius-sm); }
  .bkash-config-header { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
  .bkash-config-title { font-size:15px; font-weight:600; color:#c0395a; }
  .bkash-config-saved { font-size:11px; background:rgba(122,158,126,0.2); color:var(--sage-dark); padding:2px 10px; border-radius:20px; }
  .bkash-config-desc { font-size:12px; color:var(--muted); margin-bottom:16px; line-height:1.6; }
  .bkash-config-current { font-size:12px; color:var(--brown-light); margin-top:12px; }
  .bkash-config-current strong { color:#c0395a; font-size:14px; letter-spacing:1px; }
  .bkash-config-row { display:flex; gap:10px; }
  .bkash-number-field { flex:1; padding:12px 16px; border:1.5px solid rgba(232,90,128,0.35); border-radius:var(--radius-sm); font-family:'Jost',sans-serif; font-size:15px; font-weight:600; color:var(--brown); background:white; outline:none; letter-spacing:1px; }
  .bkash-number-field:focus { border-color:#c0395a; box-shadow:0 0 0 3px rgba(192,57,90,0.1); }
  .bkash-save-btn { background:#c0395a; color:white; border:none; padding:12px 22px; border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:background 0.2s; white-space:nowrap; }
  .bkash-save-btn:hover { background:#a02e4a; }

  .back-btn { display:inline-flex; align-items:center; gap:8px; background:none; border:none; color:var(--brown-light); font-family:'Jost',sans-serif; font-size:13px; cursor:pointer; margin-bottom:28px; transition:color 0.2s; padding:0; }
  .back-btn:hover { color:var(--terra); }
  .filter-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:40px; justify-content:center; }
  .filter-tab { padding:8px 20px; border-radius:50px; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; border:1.5px solid var(--linen2); background:var(--card); color:var(--brown-light); }
  .filter-tab:hover { border-color:var(--terra); color:var(--terra); }
  .filter-tab.active { background:var(--terra); color:white; border-color:var(--terra); }
  .toast { position:fixed; bottom:24px; right:24px; z-index:9999; background:var(--brown); color:white; padding:14px 24px; border-radius:50px; font-size:13px; box-shadow:var(--shadow-lg); animation:fadeUp 0.3s ease; }

  /* DELIVERY ZONES */
  .zone-list { display:grid; gap:10px; margin-bottom:24px; }
  .zone-row { display:flex; align-items:center; justify-content:space-between; background:var(--linen); border:1px solid var(--linen2); border-radius:var(--radius-sm); padding:12px 16px; }
  .zone-row-left { display:flex; align-items:center; gap:12px; }
  .zone-icon { font-size:18px; }
  .zone-name { font-size:14px; font-weight:500; color:var(--brown); }
  .zone-charge { font-size:13px; color:var(--terra); font-weight:600; background:rgba(196,113,74,0.1); padding:3px 10px; border-radius:20px; }
  .zone-add-row { display:grid; grid-template-columns:1fr 140px auto; gap:10px; align-items:end; }
  .zone-add-btn { background:var(--brown); color:white; border:none; padding:12px 20px; border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:background 0.2s; white-space:nowrap; }
  .zone-add-btn:hover { background:var(--terra); }

  /* ZONE SELECTOR AT CHECKOUT */
  .zone-select-wrap { position:relative; }
  .zone-select { width:100%; padding:12px 16px; border:1.5px solid var(--linen2); border-radius:var(--radius-sm); font-family:'Jost',sans-serif; font-size:14px; color:var(--brown); background:var(--linen); outline:none; cursor:pointer; appearance:none; }
  .zone-select:focus { border-color:var(--terra); }
  .zone-select.selected { border-color:var(--terra); background:rgba(196,113,74,0.04); }
  .zone-charge-badge { display:flex; align-items:center; gap:8px; margin-top:8px; font-size:13px; color:var(--brown-light); }
  .zone-charge-pill { background:rgba(196,113,74,0.12); color:var(--terra); font-weight:600; font-size:12px; padding:3px 12px; border-radius:20px; }

  /* GATEWAY ADMIN CONFIG */
  .gateway-config-box { margin-top:28px; padding:24px; background:rgba(61,43,31,0.04); border:1.5px solid var(--linen2); border-radius:var(--radius-sm); }
  .gateway-config-header { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
  .gateway-config-title { font-size:15px; font-weight:600; color:var(--brown); }
  .gateway-config-saved { font-size:11px; background:rgba(122,158,126,0.2); color:var(--sage-dark); padding:2px 10px; border-radius:20px; }
  .gateway-config-desc { font-size:12px; color:var(--muted); margin-bottom:18px; line-height:1.6; }
  .gateway-provider-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px; }
  .gateway-provider-card { border:1.5px solid var(--linen2); border-radius:var(--radius-sm); padding:12px 10px; text-align:center; cursor:pointer; transition:all 0.2s; background:white; }
  .gateway-provider-card:hover { border-color:var(--terra); }
  .gateway-provider-card.selected { border-color:var(--terra); background:rgba(196,113,74,0.05); }
  .gateway-provider-icon { font-size:22px; margin-bottom:4px; }
  .gateway-provider-name { font-size:11px; font-weight:600; color:var(--brown); letter-spacing:0.3px; }
  .gateway-fields { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
  .gateway-mode-row { display:flex; align-items:center; gap:16px; margin-bottom:16px; font-size:13px; }
  .mode-pill { padding:6px 16px; border-radius:20px; border:1.5px solid var(--linen2); background:white; font-family:'Jost',sans-serif; font-size:12px; font-weight:500; cursor:pointer; color:var(--muted); transition:all 0.2s; }
  .mode-pill.active.test { border-color:var(--gold); background:rgba(196,150,60,0.1); color:var(--gold); }
  .mode-pill.active.live { border-color:var(--sage); background:rgba(122,158,126,0.12); color:var(--sage-dark); }
  .gateway-save-btn { background:var(--brown); color:white; border:none; padding:12px 24px; border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:background 0.2s; }
  .gateway-save-btn:hover { background:var(--terra); }
  .gateway-status-row { display:flex; align-items:center; gap:10px; margin-top:14px; font-size:12px; color:var(--brown-light); }
  .gateway-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

  /* GATEWAY CHECKOUT PANEL */
  .gateway-panel { background:linear-gradient(135deg,rgba(61,43,31,0.03),rgba(196,113,74,0.04)); border:1.5px solid var(--linen2); border-radius:var(--radius-sm); padding:20px; margin-top:16px; animation:fadeIn 0.3s ease; }
  .gateway-panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .gateway-panel-title { font-size:14px; font-weight:600; color:var(--brown); }
  .gateway-provider-badge { font-size:11px; background:var(--linen2); color:var(--brown-light); padding:3px 10px; border-radius:20px; font-weight:500; letter-spacing:0.5px; }
  .gateway-accepted { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
  .gateway-chip { font-size:11px; padding:4px 10px; border-radius:20px; background:white; border:1px solid var(--linen2); color:var(--brown-light); font-weight:500; }
  .pay-now-btn { width:100%; padding:16px; background:linear-gradient(135deg,var(--brown),#5A3D2B); color:white; border:none; border-radius:50px; font-family:'Jost',sans-serif; font-size:14px; font-weight:600; letter-spacing:1px; cursor:pointer; transition:all 0.25s; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:8px; }
  .pay-now-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(61,43,31,0.25); }
  .secure-note { font-size:11px; color:var(--muted); text-align:center; margin-top:10px; display:flex; align-items:center; justify-content:center; gap:6px; }

  /* GATEWAY MODAL */
  .modal-overlay { position:fixed; inset:0; background:rgba(20,12,8,0.6); backdrop-filter:blur(4px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn 0.2s ease; }
  .modal-box { background:white; border-radius:var(--radius); width:100%; max-width:420px; overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,0.3); animation:fadeUp 0.3s ease; }
  .modal-header { background:linear-gradient(135deg,var(--brown),#5A3D2B); padding:20px 24px; display:flex; align-items:center; justify-content:space-between; }
  .modal-header-left { display:flex; align-items:center; gap:12px; }
  .modal-lock { font-size:20px; }
  .modal-title { font-family:'Cormorant Garamond',serif; font-size:18px; color:white; letter-spacing:1px; }
  .modal-amount { font-size:13px; color:rgba(255,255,255,0.7); margin-top:2px; }
  .modal-close { background:rgba(255,255,255,0.15); border:none; color:white; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s; }
  .modal-close:hover { background:rgba(255,255,255,0.25); }
  .modal-body { padding:24px; }
  .modal-provider-row { display:flex; align-items:center; gap:8px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--linen2); }
  .modal-provider-label { font-size:11px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; }
  .modal-provider-name { font-size:13px; font-weight:600; color:var(--brown); }
  .card-field-group { margin-bottom:16px; }
  .card-field-label { font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); margin-bottom:6px; display:block; }
  .card-field-input { width:100%; padding:12px 14px; border:1.5px solid var(--linen2); border-radius:var(--radius-sm); font-family:'Jost',sans-serif; font-size:15px; color:var(--brown); background:var(--linen); outline:none; letter-spacing:1px; transition:border-color 0.2s; }
  .card-field-input:focus { border-color:var(--brown); }
  .card-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .pay-modal-btn { width:100%; padding:15px; background:var(--terra); color:white; border:none; border-radius:50px; font-family:'Jost',sans-serif; font-size:14px; font-weight:600; letter-spacing:1px; cursor:pointer; transition:all 0.25s; margin-top:20px; text-transform:uppercase; }
  .pay-modal-btn:hover { background:var(--terra-dark); }
  .processing-box { text-align:center; padding:40px 20px; }
  .processing-spinner { width:52px; height:52px; border:3px solid var(--linen2); border-top-color:var(--terra); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 20px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .processing-text { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--brown); margin-bottom:8px; }
  .processing-sub { font-size:13px; color:var(--muted); }
  .done-box { text-align:center; padding:40px 20px; }
  .done-icon { font-size:56px; margin-bottom:16px; animation:fadeUp 0.4s ease; }
  .done-title { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--brown); margin-bottom:8px; }
  .done-sub { font-size:13px; color:var(--brown-light); margin-bottom:24px; line-height:1.7; }
  .done-btn { background:var(--sage); color:white; border:none; padding:12px 32px; border-radius:50px; font-family:'Jost',sans-serif; font-size:13px; font-weight:500; cursor:pointer; }

  @media (max-width:768px) {
    .product-detail, .cart-layout, .checkout-grid { grid-template-columns:1fr; }
    .hero-visual { display:none; }
    .admin-layout { grid-template-columns:1fr; }
    .stats-grid { grid-template-columns:1fr 1fr; }
    .add-product-form { grid-template-columns:1fr; }
    .nav-links { display:none; }
    .gateway-provider-grid { grid-template-columns:repeat(2,1fr); }
    .gateway-fields { grid-template-columns:1fr; }
  }
`;

// Categories, products, delivery zones, and payment methods are now loaded
// live from Supabase (see the data-loading effect below) rather than seeded
// here. Run supabase/seed.sql if you want to start from the original demo
// catalogue instead of an empty store.

const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") || "category";

const GATEWAY_PROVIDERS = [
  { id:"sslcommerz", name:"SSLCommerz",  icon:"🛡️", accepts:["Visa","Mastercard","bKash","Nagad","Rocket"] },
  { id:"shurjopay",  name:"ShurjoPay",   icon:"⚡",  accepts:["Visa","Mastercard","bKash","Nagad"] },
  { id:"aamarPay",   name:"aamarPay",    icon:"💠",  accepts:["Visa","Mastercard","bKash","Rocket"] },
  { id:"nagad",      name:"Nagad",       icon:"🟠",  accepts:["Nagad Wallet"] },
  { id:"stripe",     name:"Stripe",      icon:"🔵",  accepts:["Visa","Mastercard","AMEX"] },
  { id:"custom",     name:"Custom",      icon:"⚙️",  accepts:["Configured by Admin"] },
];

const BG_COLORS = [
  "linear-gradient(135deg,#EDE5D8,#E0D5C5)",
  "linear-gradient(135deg,#E8EDE5,#D8E5D5)",
  "linear-gradient(135deg,#EDE8E0,#E5DDD0)",
  "linear-gradient(135deg,#EAE5DE,#E0D8CC)",
];

// ─── Root Component ───────────────────────────────────────────────────────────
export default function Viventra() {
  const [page, setPage]             = useState("home");
  const [activeCat, setActiveCat]   = useState("all");
  const [selProd, setSelProd]       = useState(null);
  const [cart, setCart]             = useState([]);
  const [qty, setQty]               = useState(1);
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name:"", icon:"🏷️" });
  const [payments, setPayments]     = useState([]);
  const [orders, setOrders]         = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderStatusSort, setOrderStatusSort] = useState(null); // null | "asc" | "desc"
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [bkashNumber, setBkashNumber] = useState("01700000000");
  const [bkashDraft, setBkashDraft]   = useState("01700000000");
  const [bkashSaved, setBkashSaved]   = useState(false);
  const [toast, setToast]           = useState(null);
  const [checkout, setCheckout]     = useState({ name:"", address:"", phone:"", payment:"cod", txnCode:"", zoneId:"", bkashMode:"full" });
  // ─── reCAPTCHA (v2 checkbox) — shown at checkout to block bot/fake orders ────
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const recaptchaBoxRef = useRef(null);
  const recaptchaWidgetId = useRef(null);
  const resetRecaptcha = () => {
    if (window.grecaptcha && recaptchaWidgetId.current !== null) {
      try { window.grecaptcha.reset(recaptchaWidgetId.current); } catch {}
    }
    setRecaptchaToken("");
  };
  // Renders (or re-renders) the checkbox fresh every time the checkout page
  // is opened, since Google's script only supports rendering once per element
  // and the tokens it gives out expire after a couple of minutes.
  useEffect(() => {
    if (page !== "checkout") return;
    let cancelled = false;
    recaptchaWidgetId.current = null;
    setRecaptchaToken("");
    let tries = 0;
    const tryRender = () => {
      if (cancelled || !recaptchaBoxRef.current) return;
      if (window.grecaptcha && window.grecaptcha.render) {
        recaptchaBoxRef.current.innerHTML = "";
        recaptchaWidgetId.current = window.grecaptcha.render(recaptchaBoxRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token) => setRecaptchaToken(token),
          "expired-callback": () => setRecaptchaToken(""),
        });
      } else if (tries < 40) {
        tries++;
        setTimeout(tryRender, 250);
      }
    };
    tryRender();
    return () => { cancelled = true; };
  }, [page]);
  const [adminAuth, setAdminAuth]   = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminTab, setAdminTab]     = useState("dashboard");
  const [loginForm, setLoginForm]   = useState({ u:"", p:"" });
  const [loginErr, setLoginErr]     = useState("");
  const [editId, setEditId]         = useState(null);
  const [newProd, setNewProd]       = useState({ name:"", category:"", price:"", emoji:"🛍️", image:null, images:[], desc:"", features:"", discount:"0", discountType:"percent", stock:"", freeDelivery:false });
  const [zones, setZones]           = useState([]);
  const [zoneForm, setZoneForm]     = useState({ name:"", charge:"", isLocal:false });
  const [conditionalCod, setConditionalCod] = useState(false);
  const [gateway, setGateway]       = useState({ provider:"sslcommerz", merchantId:"", apiKey:"", mode:"test", configured:false });
  const [gatewayDraft, setGatewayDraft] = useState({ provider:"sslcommerz", merchantId:"", apiKey:"", mode:"test" });
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStep, setPayStep]       = useState("form"); // form | processing | done
  const [cardForm, setCardForm]     = useState({ number:"", expiry:"", cvv:"", name:"" });
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const fileRef                     = useRef(null);
  const galleryFileRef              = useRef(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError]     = useState("");

  // Admin identity now lives in Supabase Auth (see src/lib/api.js) — signed-in
  // session state is tracked via adminAuth/adminEmail below.
  const [pwForm, setPwForm]         = useState({ current:"", newEmail:"", newPassword:"", confirm:"" });
  const [hashDraft, setHashDraft]   = useState("vadmin-2024");

  const [copied, setCopied] = useState(false);
  const toast2 = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ─── Hidden admin access ──────────────────────────────────────────────────
  // Customers should never see the admin entrance. There are two ways in:
  //   1. URL hash trigger:  visit  yoursite.com/#<your-secret>
  //   2. Footer gesture:    click the © copyright text 5 times within 3 seconds
  // The admin can change the secret hash from the Account & Security tab.
  const [adminHashSecret, setAdminHashSecret] = useState("#vadmin-2024");
  const footerClickRef = useRef({ count: 0, firstAt: 0 });

  const openAdminEntrance = () => {
    if (adminAuth) {
      setPage("admin");
    } else {
      setPage("admin-login");
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const checkHash = () => {
      if (typeof window !== "undefined" && window.location.hash === adminHashSecret) {
        // Strip the hash so the secret isn't left visible in the address bar
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        openAdminEntrance();
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminAuth, adminHashSecret]);

  const handleFooterSecretClick = () => {
    const now = Date.now();
    const ref = footerClickRef.current;
    // Reset counter if more than 3 seconds since the first click
    if (now - ref.firstAt > 3000) {
      ref.count = 1;
      ref.firstAt = now;
    } else {
      ref.count += 1;
    }
    if (ref.count >= 5) {
      ref.count = 0;
      ref.firstAt = 0;
      openAdminEntrance();
    }
  };

  // Guard the admin route — redirect to login if not authenticated.
  // Done in useEffect (not during render) to avoid React state-update warnings.
  useEffect(() => {
    if (page === "admin" && !adminAuth) {
      setPage("admin-login");
      window.scrollTo(0, 0);
    }
  }, [page, adminAuth]);

  // ─── Load the store's live data from Supabase ───────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // On a slow or unstable mobile connection the request can hang
        // instead of failing outright, leaving the loading spinner stuck
        // forever. Give up after 20s and show the retry screen instead.
        const data = await Promise.race([
          api.fetchCatalog(),
          new Promise((_, reject) => setTimeout(
            () => reject(new Error("This is taking too long — your connection may be slow or unstable right now. Please check your internet and tap Retry.")),
            20000
          )),
        ]);
        if (!active) return;
        setCategories(data.categories);
        setProducts(data.products);
        setZones(data.zones);
        setPayments(data.settings.payments || []);
        setBkashNumber(data.settings.bkashNumber);
        setBkashDraft(data.settings.bkashNumber);
        setConditionalCod(!!data.settings.conditionalCod);
        setAdminHashSecret("#" + data.settings.adminHashSecret);
        setHashDraft(data.settings.adminHashSecret);
        const gw = data.settings.gateway || { provider:"sslcommerz", merchantId:"", apiKey:"", mode:"test", configured:false };
        setGateway(gw);
        setGatewayDraft({ provider:gw.provider||"sslcommerz", merchantId:gw.merchantId||"", apiKey:gw.apiKey||"", mode:gw.mode||"test" });
      } catch (err) {
        if (active) setLoadError(err.message || "Could not load store data. Check your Supabase configuration (.env).");
      } finally {
        if (active) setLoadingData(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Track the admin's Supabase Auth session ────────────────────────────────
  useEffect(() => {
    let active = true;
    api.getSession().then(session => {
      if (!active) return;
      setAdminAuth(!!session);
      setAdminEmail(session?.user?.email || "");
    });
    const sub = api.onAuthChange((session) => {
      setAdminAuth(!!session);
      setAdminEmail(session?.user?.email || "");
    });
    return () => { active = false; sub.unsubscribe(); };
  }, []);

  // ─── Load orders as soon as the admin is signed in ──────────────────────────
  useEffect(() => {
    if (!adminAuth || ordersLoaded) return;
    let active = true;
    api.fetchOrders()
      .then(rows => { if (active) { setOrders(rows); setOrdersLoaded(true); } })
      .catch(err => { if (active) toast2("⚠️ " + (err.message || "Could not load orders")); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminAuth]);

  // ─── Manual refresh for the admin Orders tab (checks for new orders) ────────
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const refreshOrders = async () => {
    setRefreshingOrders(true);
    try {
      const rows = await api.fetchOrders();
      setOrders(rows);
      toast2("✓ Orders refreshed");
    } catch (err) {
      toast2("⚠️ " + (err.message || "Could not refresh orders"));
    } finally {
      setRefreshingOrders(false);
    }
  };

  const copyBkash = () => {
    navigator.clipboard.writeText(bkashNumber).then(()=>{
      setCopied(true); setTimeout(()=>setCopied(false), 2000);
    });
  };
  const nav = (p) => { setPage(p); window.scrollTo(0,0); };

  const addToCart = (product, quantity=1) => {
    setCart(prev => {
      const ex = prev.find(i=>i.id===product.id);
      if (ex) return prev.map(i=>i.id===product.id?{...i,qty:i.qty+quantity}:i);
      return [...prev,{...product,qty:quantity}];
    });
    toast2(`✓ ${product.name} added`);
  };
  const getFinalPrice = (p) => {
    const d = Number(p.discount) || 0;
    if (d <= 0) return p.price;
    if (p.discountType === "flat") return Math.max(0, p.price - d);
    return Math.round(p.price * (1 - d / 100));
  };
  const getSavings = (p) => p.price - getFinalPrice(p);
  const hasDiscount = (p) => getSavings(p) > 0;

  const removeFromCart = (id) => setCart(prev=>prev.filter(i=>i.id!==id));
  const cartTotal = cart.reduce((s,i)=>s+getFinalPrice(i)*i.qty,0);
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const enabledPayments = payments.filter(p=>p.enabled);
  const selectedZone    = zones.find(z=>z.id===checkout.zoneId) || null;
  // If any item in the cart is marked "Free Delivery" by the admin, the whole
  // order's delivery charge is waived — simplest rule for a single flat
  // per-order delivery fee (rather than trying to split it item by item).
  const cartHasFreeDelivery = cart.some(i=>i.freeDelivery);
  const deliveryCharge  = cartHasFreeDelivery ? 0 : (selectedZone ? selectedZone.charge : 0);
  const orderTotal      = cartTotal + deliveryCharge;
  // Conditional COD: when ON, customers ordering COD to non-local zones
  // must pay the delivery charge in advance via bKash. Product cost stays COD.
  // Doesn't apply when delivery is already free — there's nothing to advance.
  const requiresConditionalCod = conditionalCod
    && checkout.payment === "cod"
    && selectedZone
    && selectedZone.isLocal === false
    && !cartHasFreeDelivery;
  // The "Partial — Delivery Only" bKash mode only makes sense when there's an
  // actual delivery charge to pay in advance.
  const bkashPartialActive = checkout.bkashMode === "partial" && !cartHasFreeDelivery;

  // Shrinks a photo before it's stored, so product photos don't bloat the
  // catalogue that every visitor has to download on page load — the main
  // reason the site could be slow or fail to load on Bangladeshi mobile
  // data. A typical phone photo (3-5MB) becomes ~150-300KB after this.
  const compressImage = (file, maxDim = 1280, quality = 0.72) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
          else { width = Math.round(width * (maxDim / height)); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  const handleImgUpload = (e) => {
    const file = e.target.files[0]; e.target.value = ""; if(!file) return;
    if(!file.type.startsWith("image/")){ toast2("⚠️ Please select an image file"); return; }
    if(file.size > 8 * 1024 * 1024){ toast2("⚠️ Image must be under 8MB"); return; }
    compressImage(file)
      .then(dataUrl => setNewProd(f=>({...f,image:dataUrl})))
      .catch(() => toast2("⚠️ Could not process that image"));
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    files.forEach(file => {
      if(!file.type.startsWith("image/")){ toast2("⚠️ Please select image files"); return; }
      if(file.size > 8 * 1024 * 1024){ toast2("⚠️ Each image must be under 8MB"); return; }
      compressImage(file)
        .then(dataUrl => setNewProd(f=>({...f, images:[...(f.images||[]), dataUrl]})))
        .catch(() => toast2("⚠️ Could not process one of the images"));
    });
  };
  const removeGalleryImage = (i) => setNewProd(f=>({...f, images:(f.images||[]).filter((_,idx)=>idx!==i)}));

  const handleAdminLogin = async () => {
    try {
      await api.signIn(loginForm.u.trim(), loginForm.p);
      setAdminAuth(true);
      setLoginErr("");
      setLoginForm({u:"",p:""});
      nav("admin");
    } catch (err) {
      setLoginErr(err.message || "Invalid email or password");
    }
  };

  const updateAdminHash = async () => {
    const v = hashDraft.trim().replace(/^#+/, "");
    if (!v) { toast2("⚠️ Enter a secret keyword"); return; }
    if (v.length < 4) { toast2("⚠️ Secret must be at least 4 characters"); return; }
    if (!/^[A-Za-z0-9_-]+$/.test(v)) { toast2("⚠️ Use only letters, numbers, dashes or underscores"); return; }
    try {
      await api.updateSettingsRow({ adminHashSecret: v });
      setAdminHashSecret("#" + v);
      toast2("✓ Secret URL updated");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not update secret URL")); }
  };

  const changeAdminCreds = async () => {
    if(!pwForm.current){ toast2("⚠️ Enter your current password"); return; }
    const newPass = pwForm.newPassword;
    const newEmail = pwForm.newEmail.trim();
    if(!newPass){ toast2("⚠️ Enter a new password"); return; }
    if(newPass.length<6){ toast2("⚠️ Password must be at least 6 characters"); return; }
    if(newPass!==pwForm.confirm){ toast2("⚠️ New passwords do not match"); return; }
    try {
      // Re-authenticate with the current password before changing anything
      await api.signIn(adminEmail, pwForm.current);
      await api.updatePassword(newPass);
      if (newEmail && newEmail !== adminEmail) {
        await api.updateEmail(newEmail);
        toast2("✓ Password updated — check your new email inbox to confirm the address change");
      } else {
        toast2("✓ Password updated successfully");
      }
      setPwForm({ current:"", newEmail:"", newPassword:"", confirm:"" });
    } catch (err) {
      toast2("⚠️ " + (err.message || "Could not update credentials"));
    }
  };

  const saveProduct = async () => {
    if(!newProd.name||!newProd.price){ toast2("⚠️ Name and price required"); return; }
    const discountVal = Math.max(0, Number(newProd.discount) || 0);
    const stockVal = newProd.stock === "" ? null : Math.max(0, Math.trunc(Number(newProd.stock)) || 0);
    const featuresArr = newProd.features.split("\n").filter(Boolean);
    try {
      if(editId!==null){
        const merged = {...products.find(p=>p.id===editId), ...newProd, price:Number(newProd.price), discount:discountVal, stock:stockVal, features:featuresArr};
        await api.updateProductRow(editId, merged);
        setProducts(prev=>prev.map(p=>p.id===editId?merged:p));
        toast2("✓ Product updated"); setEditId(null);
      } else {
        const inserted = await api.insertProduct({...newProd, price:Number(newProd.price), discount:discountVal, stock:stockVal, badge:null, features:featuresArr, visible:true});
        setProducts(prev=>[...prev, inserted]);
        toast2("✓ Product added");
      }
      setNewProd({name:"",category:categories[0]?.id||"",price:"",emoji:"🛍️",image:null,images:[],desc:"",features:"",discount:"0",discountType:"percent",stock:"",freeDelivery:false});
      setAdminTab("products");
    } catch (err) {
      toast2("⚠️ " + (err.message || "Could not save product"));
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setNewProd({name:p.name,category:p.category,price:String(p.price),emoji:p.emoji,image:p.image||null,images:p.images||[],desc:p.desc,features:(p.features||[]).join("\n"),discount:String(p.discount||0),discountType:p.discountType||"percent",stock:(p.stock===null||p.stock===undefined)?"":String(p.stock),freeDelivery:!!p.freeDelivery});
    setAdminTab("add");
  };

  const toggleProductVisible = async (p) => {
    try {
      await api.updateProductRow(p.id, {...p, visible: !p.visible});
      setProducts(prev=>prev.map(x=>x.id===p.id?{...x,visible:!x.visible}:x));
      toast2(p.visible?"Hidden":"Shown");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not update product")); }
  };

  const deleteProduct = async (id) => {
    if(!window.confirm("Delete?")) return;
    try {
      await api.deleteProductRow(id);
      setProducts(prev=>prev.filter(x=>x.id!==id));
      toast2("Deleted");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not delete product")); }
  };

  const editCategory = async (c) => {
    const newName = window.prompt("New name for this category:", c.name);
    if(!newName||!newName.trim()) return;
    const newIcon = window.prompt("Icon (emoji) for this category:", c.icon) || c.icon;
    try {
      await api.updateCategoryRow(c.id, { name:newName.trim(), icon:newIcon });
      setCategories(prev=>prev.map(x=>x.id===c.id?{...x,name:newName.trim(),icon:newIcon}:x));
      toast2("✓ Category updated");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not update category")); }
  };

  const removeCategory = async (c, inUse) => {
    if(inUse>0){ toast2(`⚠️ ${inUse} product(s) still use "${c.name}" — reassign them first`); return; }
    if(!window.confirm(`Remove "${c.name}"?`)) return;
    try {
      await api.deleteCategoryRow(c.id);
      setCategories(prev=>prev.filter(x=>x.id!==c.id));
      toast2("Category removed");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not remove category")); }
  };

  const addCategory = async () => {
    if(!categoryForm.name.trim()){ toast2("⚠️ Category name required"); return; }
    const base = slugify(categoryForm.name);
    const id = categories.some(c=>c.id===base) ? base+"-"+Date.now() : base;
    const cat = { id, name:categoryForm.name.trim(), icon:categoryForm.icon||"🏷️" };
    try {
      await api.insertCategory(cat);
      setCategories(prev=>[...prev,cat]);
      setCategoryForm({name:"",icon:"🏷️"});
      toast2("✓ Category added");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not add category")); }
  };

  const toggleZoneLocal = async (z) => {
    try {
      await api.updateZoneRow(z.id, { isLocal: !z.isLocal });
      setZones(prev=>prev.map(x=>x.id===z.id?{...x,isLocal:!x.isLocal}:x));
      toast2(z.isLocal?`${z.name} marked as outside-local area`:`✓ ${z.name} marked as local`);
    } catch (err) { toast2("⚠️ " + (err.message || "Could not update zone")); }
  };

  const removeZone = async (id) => {
    try {
      await api.deleteZoneRow(id);
      setZones(prev=>prev.filter(x=>x.id!==id));
      toast2("Zone removed");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not remove zone")); }
  };

  const addZone = async () => {
    if(!zoneForm.name.trim()||!zoneForm.charge){ toast2("⚠️ Name and charge required"); return; }
    const zone = { id:"z"+Date.now(), name:zoneForm.name.trim(), charge:Number(zoneForm.charge), isLocal:zoneForm.isLocal };
    try {
      await api.insertZone(zone);
      setZones(prev=>[...prev,zone]);
      setZoneForm({name:"",charge:"",isLocal:false});
      toast2("✓ Zone added");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not add zone")); }
  };

  const togglePayment = async (pm) => {
    const updated = payments.map(p=>p.id===pm.id?{...p,enabled:!p.enabled}:p);
    try {
      await api.updateSettingsRow({ payments: updated });
      setPayments(updated);
      toast2(`${pm.name} ${pm.enabled?"disabled":"enabled"}`);
    } catch (err) { toast2("⚠️ " + (err.message || "Could not update payment method")); }
  };

  const toggleConditionalCod = async () => {
    const next = !conditionalCod;
    try {
      await api.updateSettingsRow({ conditionalCod: next });
      setConditionalCod(next);
    } catch (err) { toast2("⚠️ " + (err.message || "Could not update setting")); }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.updateOrderStatusRow(id, status);
      setOrders(prev=>prev.map(o=>o.id===id?{...o,status}:o));
      toast2("✓ Order updated");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not update order")); }
  };

  const saveGateway = async () => {
    if(!gatewayDraft.merchantId.trim()||!gatewayDraft.apiKey.trim()){ toast2("⚠️ Merchant ID and API Key required"); return; }
    const next = {...gatewayDraft, configured:true};
    try {
      await api.updateSettingsRow({ gateway: next });
      setGateway(next);
      toast2("✓ Gateway configured");
    } catch (err) { toast2("⚠️ " + (err.message || "Could not save gateway settings")); }
  };

  const simulatePay = () => {
    if(!cardForm.number||!cardForm.expiry||!cardForm.cvv||!cardForm.name){ toast2("⚠️ Fill all card details"); return; }
    setPayStep("processing");
    setTimeout(()=>setPayStep("done"), 2800);
  };

  // Called when the (demo/fallback) card modal finishes "processing". If a
  // real gateway session was attempted, the pending order it created just
  // gets marked verified here; otherwise this is the whole demo flow.
  const confirmGatewayOrder = async () => {
    setShowPayModal(false); setPayStep("form");
    try {
      if (pendingOrderId) {
        await api.updateOrderStatusRow(pendingOrderId, "verified");
      } else {
        await createOrderRow("gateway", "verified");
      }
    } catch (err) {
      toast2("⚠️ " + (err.message || "Could not confirm the order"));
    }
    setPendingOrderId(null);
    setCart([]);
    nav("success");
  };

  const activeGatewayProvider = GATEWAY_PROVIDERS.find(g=>g.id===gateway.provider) || GATEWAY_PROVIDERS[0];

  // Inserts the order row from the current cart/checkout state into Supabase.
  const createOrderRow = async (paymentMethod, status, advancePaid=false) => {
    return api.insertOrder({
      name: checkout.name,
      address: checkout.address,
      phone: checkout.phone,
      payment: paymentMethod,
      txnCode: checkout.txnCode,
      zoneId: checkout.zoneId,
      bkashMode: checkout.bkashMode,
      items: cart.map(i=>({ id:i.id, name:i.name, qty:i.qty, price:getFinalPrice(i) })),
      subtotal: cartTotal,
      deliveryCharge,
      total: orderTotal,
      status,
      advancePaid,
      recaptchaToken,
    });
  };

  // COD / manual bKash path: record the order immediately and finish.
  const submitOrder = async (paymentMethod, opts = {}) => {
    try {
      await createOrderRow(
        paymentMethod,
        opts.status || (paymentMethod==="manual_bkash" || requiresConditionalCod ? "pending_verification" : "pending"),
        !!opts.advancePaid
      );
      setCart([]);
      nav("success");
    } catch (err) {
      toast2("⚠️ " + (err.message || "Could not place order — please try again"));
      resetRecaptcha();
    }
  };

  // Online gateway path: create a pending order, then try a real SSLCommerz
  // session (server-side, needs SSLCOMMERZ_STORE_ID/PASSWORD set on the
  // deployment). If that endpoint isn't configured yet — e.g. no keys set,
  // or running `vite dev` without the /api functions — fall back to the
  // built-in demo card modal so checkout still works end-to-end.
  const startGatewayCheckout = async () => {
    let order;
    try {
      order = await createOrderRow("gateway", "pending");
    } catch (err) {
      toast2("⚠️ " + (err.message || "Could not place order — please try again"));
      resetRecaptcha();
      return;
    }
    setPendingOrderId(order.id);
    try {
      const res = await fetch("/api/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id, amount: orderTotal,
          customerName: checkout.name, customerPhone: checkout.phone, customerAddress: checkout.address,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.configured && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
    } catch {
      // fall through to the demo modal below
    }
    setShowPayModal(true); setPayStep("form"); setCardForm({number:"",expiry:"",cvv:"",name:""});
  };

  const placeOrder = async () => {
    if(enabledPayments.length===0){ toast2("⚠️ No payment methods available. Please contact the store."); return; }
    if(!checkout.payment){ toast2("⚠️ Please select a payment method"); return; }
    if(!checkout.name||!checkout.address||!checkout.phone){ toast2("⚠️ Fill all delivery fields"); return; }
    if(!checkout.zoneId){ toast2("⚠️ Please select a delivery zone"); return; }
    if(checkout.payment==="manual_bkash"&&!checkout.txnCode.trim()){ toast2("⚠️ Enter your bKash Transaction ID"); return; }
    if(requiresConditionalCod&&!checkout.txnCode.trim()){ toast2("⚠️ Outside Dhaka — please pay delivery charge via bKash and enter the Transaction ID"); return; }
    if(!recaptchaToken){ toast2("⚠️ Please complete the verification checkbox"); return; }
    if(checkout.payment==="gateway"){ await startGatewayCheckout(); return; }
    await submitOrder(checkout.payment, { advancePaid: requiresConditionalCod });
  };

  const saveBkashNumber = async () => {
    const num = bkashDraft.trim();
    if(!num){ toast2("⚠️ Enter a number"); return; }
    if(!/^01[3-9]\d{8}$/.test(num)){ toast2("⚠️ Invalid format. Use 01XXXXXXXXX (11 digits)"); return; }
    try {
      await api.updateSettingsRow({ bkashNumber: num });
      setBkashNumber(num);
      setBkashSaved(true); toast2("✓ bKash number saved");
      setTimeout(()=>setBkashSaved(false),3000);
    } catch (err) { toast2("⚠️ " + (err.message || "Could not save bKash number")); }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:"var(--linen)"}}>
          <img src={LOGO_BADGE} alt="Viventra" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",boxShadow:"0 4px 12px rgba(61,43,31,0.15)"}}/>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--brown)"}}>Loading VIVENTRA…</div>
        </div>
      </>
    );
  }
  if (loadError) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:"var(--linen)",padding:24,textAlign:"center"}}>
          <div style={{fontSize:32}}>⚠️</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--brown)"}}>Couldn't load the store</div>
          <div style={{maxWidth:480,fontSize:14,color:"var(--muted)",lineHeight:1.7}}>{loadError}</div>
          <div style={{maxWidth:480,fontSize:12,color:"var(--muted)",lineHeight:1.7}}>
            Check that <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are set (see <code>.env.example</code>), and that <code>supabase/schema.sql</code> has been run in your Supabase project.
          </div>
          <button className="btn-primary" onClick={()=>window.location.reload()}>Retry</button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      {toast && <div className="toast">{toast}</div>}

      {/* ════ ADMIN LOGIN ════════════════════════════════════════════════════ */}
      {page==="admin-login" && (
        <div className="admin-login fade-in">
          <div className="admin-login-card">
            <div style={{textAlign:"center",marginBottom:8}}>
              <img src={LOGO_BADGE} alt="Viventra" style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",boxShadow:"0 4px 12px rgba(61,43,31,0.15)"}}/>
            </div>
            <div className="admin-login-logo">VIVENTRA</div>
            <div className="admin-login-sub">Admin Portal</div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@viventra.shop" value={loginForm.u}
                onChange={e=>setLoginForm(f=>({...f,u:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={loginForm.p}
                onChange={e=>setLoginForm(f=>({...f,p:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}/>
            </div>
            {loginErr && <div className="login-error">{loginErr}</div>}
            <button className="login-btn" onClick={handleAdminLogin}>Login</button>
            <div style={{marginTop:20,textAlign:"center"}}>
              <button className="back-btn" onClick={()=>nav("home")}>← Back to Store</button>
            </div>
            <div style={{marginTop:20,padding:"10px 14px",background:"rgba(196,150,60,0.08)",border:"1px solid rgba(196,150,60,0.25)",borderRadius:"var(--radius-sm)",fontSize:11,color:"var(--brown-light)",textAlign:"center",lineHeight:1.6}}>
              No admin account yet? Create one in your Supabase project under <strong style={{color:"var(--gold)"}}>Authentication → Users → Add user</strong>.
            </div>
            <div style={{marginTop:14,fontSize:10,color:"var(--muted)",textAlign:"center",lineHeight:1.7,letterSpacing:0.3}}>
              🔒 Access this page via <code style={{background:"var(--linen2)",padding:"1px 5px",borderRadius:3,fontSize:10}}>{adminHashSecret}</code> in the URL,<br/>
              or by clicking the footer copyright 5× rapidly.
            </div>
          </div>
        </div>
      )}

      {/* ════ ADMIN DASHBOARD ════════════════════════════════════════════════ */}
      {page==="admin"&&adminAuth&&(
        <div className="admin-layout fade-in">
          {/* Sidebar */}
          <div className="admin-sidebar">
            <div className="admin-brand">
              <div className="admin-brand-name">VIVENTRA</div>
              <div className="admin-brand-sub">Admin Panel</div>
            </div>
            <div className="admin-nav">
              {[
                {id:"dashboard",  icon:"📊",label:"Dashboard"},
                {id:"orders",     icon:"🧾",label:"Orders"},
                {id:"products",   icon:"📦",label:"Products"},
                {id:"categories", icon:"🗂️",label:"Categories"},
                {id:"add",      icon:editId?"✏️":"➕",label:editId?"Edit Product":"Add Product"},
                {id:"payments", icon:"💳",label:"Payment Settings"},
                {id:"delivery", icon:"🚚",label:"Delivery Zones"},
                {id:"account",  icon:"🔐",label:"Account & Security"},
              ].map(item=>(
                <button key={item.id} className={`admin-nav-item ${adminTab===item.id?"active":""}`}
                  onClick={()=>setAdminTab(item.id)}>
                  {item.icon} {item.label}
                </button>
              ))}
              <button className="admin-nav-item" style={{marginTop:40}}
                onClick={async ()=>{await api.signOut();setAdminAuth(false);nav("home");}}>
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="admin-content">

            {/* Dashboard */}
            {adminTab==="dashboard"&&(
              <div className="fade-up">
                <div className="admin-header">
                  <div className="admin-title">Dashboard</div>
                  <div className="admin-subtitle">Your VIVENTRA store at a glance</div>
                </div>
                <div className="stats-grid">
                  {[{icon:"🧾",value:orders.filter(o=>o.status==="pending"||o.status==="pending_verification").length,label:"Pending Orders"},{icon:"📦",value:products.length,label:"Total Products"},{icon:"✅",value:products.filter(p=>p.visible).length,label:"Active Listings"},{icon:"🗂️",value:categories.length,label:"Categories"},{icon:"💳",value:payments.filter(p=>p.enabled).length,label:"Payment Methods"}].map((s,i)=>(
                    <div key={i} className="stat-card">
                      <div className="stat-icon">{s.icon}</div>
                      <div className="stat-value">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="admin-card">
                  <div className="admin-card-title">Recent Products</div>
                  <table className="admin-table">
                    <thead><tr><th>Photo</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th></tr></thead>
                    <tbody>
                      {products.slice(0,6).map(p=>(
                        <tr key={p.id}>
                          <td><div className="tbl-thumb">{p.image?<img src={p.image} alt={p.name}/>:p.emoji}</div></td>
                          <td><span className="tbl-name">{p.name}</span></td>
                          <td style={{textTransform:"capitalize"}}>{p.category.replace("-"," ")}</td>
                          <td><span className="tbl-price">৳{p.price.toLocaleString()}</span></td>
                          <td><span className={`tbl-badge ${p.visible?"active":"inactive"}`}>{p.visible?"Active":"Hidden"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Orders */}
            {adminTab==="orders"&&(
              <div className="fade-up">
                <div className="admin-header">
                  <div className="admin-title">Orders</div>
                  <div className="admin-subtitle">Orders placed on the storefront, newest first</div>
                </div>
                <div className="admin-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:16}}>
                    <div className="admin-card-title" style={{margin:0}}>All Orders ({orders.length})</div>
                    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                      <select className="form-select" style={{padding:"8px 12px",fontSize:13,maxWidth:220}}
                        value={orderStatusFilter} onChange={e=>setOrderStatusFilter(e.target.value)}>
                        <option value="all">Filter: All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="pending_verification">Awaiting Verification</option>
                        <option value="verified">Verified</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button className="action-btn" onClick={refreshOrders} disabled={refreshingOrders} style={refreshingOrders?{opacity:0.6,cursor:"not-allowed"}:undefined}>
                        {refreshingOrders?"⏳ Refreshing…":"🔄 Refresh"}
                      </button>
                    </div>
                  </div>
                  <table className="admin-table">
                    <thead><tr>
                      <th>Date</th><th>Customer</th><th>Address</th><th>Items</th><th>Payment</th><th>Total</th>
                      <th style={{cursor:"pointer",userSelect:"none"}}
                        onClick={()=>setOrderStatusSort(s=>s==="asc"?"desc":s==="desc"?null:"asc")}>
                        Status {orderStatusSort==="asc"?"▲":orderStatusSort==="desc"?"▼":""}
                      </th>
                    </tr></thead>
                    <tbody>
                      {orders
                        .filter(o=>orderStatusFilter==="all"||o.status===orderStatusFilter)
                        .slice()
                        .sort((a,b)=>{
                          if(!orderStatusSort) return 0;
                          const cmp = String(a.status).localeCompare(String(b.status));
                          return orderStatusSort==="asc"?cmp:-cmp;
                        })
                        .map(o=>{
                        const statusMeta = {
                          pending:               { label:"Pending",              cls:"" },
                          pending_verification:  { label:"Awaiting Verification",cls:"" },
                          verified:              { label:"Verified",             cls:"active" },
                          shipped:               { label:"Shipped",              cls:"active" },
                          delivered:             { label:"Delivered",            cls:"active" },
                          cancelled:             { label:"Cancelled",            cls:"inactive" },
                        }[o.status] || { label:o.status, cls:"" };
                        const paymentLabel = {
                          cod:"Cash on Delivery", manual_bkash:"bKash (Manual)", gateway:"Online Gateway", card:"Card", bank:"Bank Transfer",
                        }[o.payment_method] || o.payment_method;
                        return (
                          <tr key={o.id}>
                            <td style={{fontSize:12,color:"var(--muted)"}}>{new Date(o.created_at).toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</td>
                            <td>
                              <div className="tbl-name">{o.customer_name}</div>
                              <div style={{fontSize:11,color:"var(--muted)"}}>{o.phone}</div>
                            </td>
                            <td style={{fontSize:12,color:"var(--brown-light)",maxWidth:220}}>
                              <div>{o.address}</div>
                              {o.zone_id && (
                                <div style={{fontSize:11,color:"var(--muted)"}}>
                                  Zone: {zones.find(z=>z.id===o.zone_id)?.name || o.zone_id}
                                </div>
                              )}
                            </td>
                            <td style={{fontSize:12,color:"var(--brown-light)"}}>
                              {(o.items||[]).map(it=>`${it.name} ×${it.qty}`).join(", ")}
                            </td>
                            <td style={{fontSize:12}}>
                              {paymentLabel}
                              {o.txn_code && <div style={{color:"var(--muted)",fontSize:11}}>TxnID: {o.txn_code}</div>}
                            </td>
                            <td><span className="tbl-price">৳{Number(o.total).toLocaleString()}</span></td>
                            <td>
                              <select className="form-select" style={{padding:"6px 10px",fontSize:12}}
                                value={o.status} onChange={e=>updateOrderStatus(o.id, e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="pending_verification">Awaiting Verification</option>
                                <option value="verified">Verified</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {orders.length===0&&(
                    <div style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:14}}>
                      No orders yet — they'll show up here as customers check out.
                    </div>
                  )}
                  {orders.length>0&&orders.filter(o=>orderStatusFilter==="all"||o.status===orderStatusFilter).length===0&&(
                    <div style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:14}}>
                      No orders match that status filter.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Products */}
            {adminTab==="products"&&(
              <div className="fade-up">
                <div className="admin-header">
                  <div className="admin-title">Products</div>
                  <div className="admin-subtitle">Manage your catalogue</div>
                </div>
                <div className="admin-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                    <div className="admin-card-title" style={{margin:0}}>All Products ({products.length})</div>
                    <button className="save-btn" onClick={()=>{setEditId(null);setNewProd({name:"",category:categories[0]?.id||"",price:"",emoji:"🛍️",image:null,images:[],desc:"",features:"",discount:"0",discountType:"percent",stock:"",freeDelivery:false});setAdminTab("add");}}>+ Add New</button>
                  </div>
                  <table className="admin-table">
                    <thead><tr><th>Photo</th><th>Name</th><th>Category</th><th>Price</th><th>Discount</th><th>Stock</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {products.map(p=>(
                        <tr key={p.id}>
                          <td><div className="tbl-thumb">{p.image?<img src={p.image} alt={p.name}/>:p.emoji}</div></td>
                          <td><span className="tbl-name">{p.name}</span></td>
                          <td style={{textTransform:"capitalize"}}>{p.category.replace("-"," ")}</td>
                          <td>
                            <span className="tbl-price">৳{p.price.toLocaleString()}</span>
                            {Number(p.discount)>0&&<div style={{fontSize:11,color:"var(--muted)",textDecoration:"line-through"}}>was ৳{p.price.toLocaleString()}</div>}
                          </td>
                          <td>
                            {Number(p.discount)>0
                              ? <span className="tbl-discount">{p.discountType==="percent"?`${p.discount}% OFF`:`৳${p.discount} OFF`}</span>
                              : <span style={{fontSize:12,color:"var(--muted)"}}>—</span>}
                          </td>
                          <td>
                            {p.stock===null||p.stock===undefined
                              ? <span style={{fontSize:12,color:"var(--muted)"}}>Unlimited</span>
                              : Number(p.stock)<=0
                                ? <span style={{fontSize:12,color:"#E8384F",fontWeight:600}}>Out of stock</span>
                                : <span style={{fontSize:13,color:Number(p.stock)<=5?"#C77A2E":"var(--brown-light)",fontWeight:Number(p.stock)<=5?600:400}}>{p.stock}</span>}
                          </td>
                          <td>
                            {p.freeDelivery
                              ? <span className="tbl-badge active">🚚 Free</span>
                              : <span style={{fontSize:12,color:"var(--muted)"}}>—</span>}
                          </td>
                          <td><span className={`tbl-badge ${p.visible?"active":"inactive"}`}>{p.visible?"Active":"Hidden"}</span></td>
                          <td>
                            <button className="action-btn" onClick={()=>startEdit(p)}>Edit</button>
                            <button className="action-btn" onClick={()=>toggleProductVisible(p)}>{p.visible?"Hide":"Show"}</button>
                            <button className="action-btn danger" onClick={()=>deleteProduct(p.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Categories */}
            {adminTab==="categories"&&(
              <div className="fade-up">
                <div className="admin-header">
                  <div className="admin-title">Categories</div>
                  <div className="admin-subtitle">Control the product types shown on the homepage, nav bar, and shop filters</div>
                </div>
                <div className="admin-card">
                  <div className="admin-card-title">Active Categories ({categories.length})</div>
                  <div className="zone-list">
                    {categories.map(c=>{
                      const inUse = products.filter(p=>p.category===c.id).length;
                      return (
                        <div key={c.id} className="zone-row">
                          <div className="zone-row-left">
                            <span className="zone-icon">{c.icon}</span>
                            <span className="zone-name">{c.name}</span>
                            <span style={{marginLeft:10,fontSize:12,color:"var(--muted)"}}>{inUse} product{inUse===1?"":"s"}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <button className="action-btn" onClick={()=>editCategory(c)}>Edit</button>
                            <button className="action-btn danger" onClick={()=>removeCategory(c, inUse)}>Remove</button>
                          </div>
                        </div>
                      );
                    })}
                    {categories.length===0&&(
                      <div style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:14}}>
                        No categories yet — add your first one below.
                      </div>
                    )}
                  </div>
                  <div style={{borderTop:"1px solid var(--linen2)",paddingTop:24}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:"var(--brown)",marginBottom:16}}>Add New Category</div>
                    <div className="zone-add-row">
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Icon (emoji)</label>
                        <input className="form-input" placeholder="e.g. 🪴"
                          value={categoryForm.icon} onChange={e=>setCategoryForm(f=>({...f,icon:e.target.value}))}/>
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Category Name</label>
                        <input className="form-input" placeholder="e.g. Rugs & Textiles"
                          value={categoryForm.name} onChange={e=>setCategoryForm(f=>({...f,name:e.target.value}))}
                          onKeyDown={e=>{ if(e.key==="Enter"&&categoryForm.name.trim()) addCategory(); }}/>
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label" style={{visibility:"hidden"}}>x</label>
                        <button className="zone-add-btn" onClick={addCategory}>+ Add Category</button>
                      </div>
                    </div>
                    <div style={{marginTop:16,padding:"12px 16px",background:"var(--linen)",borderRadius:"var(--radius-sm)",fontSize:12,color:"var(--muted)"}}>
                      💡 New categories appear immediately in the homepage nav, the "Browse By" grid, and the shop filters — and in the Category dropdown when adding a product.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add / Edit Product */}
            {adminTab==="add"&&(
              <div className="fade-up">
                <div className="admin-header">
                  <div className="admin-title">{editId?"Edit Product":"Add New Product"}</div>
                  <div className="admin-subtitle">{editId?"Update product details":"Fill in the product info"}</div>
                </div>
                <div className="admin-card">
                  <div className="add-product-form">

                    {/* ── IMAGE UPLOAD ── */}
                    <div className="form-group full">
                      <label className="form-label">Product Photo</label>
                      <div className={`img-upload-area ${newProd.image?"filled":""}`}
                        onClick={()=>!newProd.image&&fileRef.current?.click()}>
                        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                          onChange={handleImgUpload}/>
                        {newProd.image?(
                          <>
                            <img src={newProd.image} alt="preview" className="img-preview"/>
                            <div className="img-overlay">
                              <button className="img-overlay-btn" onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>📷 Change</button>
                              <button className="img-overlay-btn" onClick={e=>{e.stopPropagation();setNewProd(f=>({...f,image:null}));}}>🗑 Remove</button>
                            </div>
                          </>
                        ):(
                          <>
                            <div className="img-upload-icon">📷</div>
                            <div className="img-upload-text">Click to upload product photo</div>
                            <div className="img-upload-hint">JPG · PNG · WEBP — Max 8MB</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── ADDITIONAL PHOTOS (GALLERY) ── */}
                    <div className="form-group full">
                      <label className="form-label">Additional Photos (optional)</label>
                      <input ref={galleryFileRef} type="file" accept="image/*" multiple style={{display:"none"}}
                        onChange={handleGalleryUpload}/>
                      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:8}}>
                        {(newProd.images||[]).map((src,i)=>(
                          <div key={i} style={{position:"relative",width:72,height:72,borderRadius:8,overflow:"hidden",border:"1px solid var(--border)"}}>
                            <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            <button type="button" onClick={()=>removeGalleryImage(i)}
                              style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:"50%",width:20,height:20,fontSize:11,cursor:"pointer",lineHeight:"20px",padding:0}}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={()=>galleryFileRef.current?.click()}
                          style={{width:72,height:72,borderRadius:8,border:"1px dashed var(--border)",background:"none",cursor:"pointer",fontSize:22,color:"var(--muted)"}}>+</button>
                      </div>
                      <div className="img-upload-hint">Shown as a photo gallery on the product page, alongside the main photo above. JPG · PNG · WEBP — Max 8MB each</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Product Name *</label>
                      <input className="form-input" placeholder="e.g. Minimalist Oak Shelf"
                        value={newProd.name} onChange={e=>setNewProd(f=>({...f,name:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select className="form-select" value={newProd.category} onChange={e=>setNewProd(f=>({...f,category:e.target.value}))}>
                        {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price (৳) *</label>
                      <input className="form-input" type="number" placeholder="e.g. 8500"
                        value={newProd.price} onChange={e=>setNewProd(f=>({...f,price:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Emoji Icon (fallback if no photo)</label>
                      <input className="form-input" placeholder="e.g. 🛋️"
                        value={newProd.emoji} onChange={e=>setNewProd(f=>({...f,emoji:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stock Quantity (leave blank for unlimited)</label>
                      <input className="form-input" type="number" min="0" placeholder="e.g. 25 — blank = don't track"
                        value={newProd.stock} onChange={e=>setNewProd(f=>({...f,stock:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Delivery</label>
                      <label style={{display:"flex",alignItems:"center",gap:8,marginTop:6,cursor:"pointer",fontSize:13,color:"var(--brown-light)"}}>
                        <input type="checkbox" checked={!!newProd.freeDelivery}
                          onChange={e=>setNewProd(f=>({...f,freeDelivery:e.target.checked}))} style={{cursor:"pointer"}}/>
                        🚚 Offer <strong style={{color:"var(--sage-dark)"}}>Free Delivery</strong> on this product
                      </label>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Description *</label>
                      <textarea className="form-input form-textarea" placeholder="Describe the product..."
                        value={newProd.desc} onChange={e=>setNewProd(f=>({...f,desc:e.target.value}))}/>
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Features (one per line)</label>
                      <textarea className="form-input form-textarea" placeholder={"Solid oak wood\nNatural finish\nEasy assembly"}
                        value={newProd.features} onChange={e=>setNewProd(f=>({...f,features:e.target.value}))}/>
                    </div>

                    {/* ── DISCOUNT / OFFER ── */}
                    <div className="form-group full" style={{background:"rgba(232,56,79,0.04)",border:"1.5px solid rgba(232,56,79,0.15)",borderRadius:"var(--radius-sm)",padding:"20px"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:"var(--brown)",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
                        🏷️ Discount / Offer
                        {Number(newProd.discount)>0&&<span style={{fontSize:11,background:"rgba(232,56,79,0.12)",color:"#E8384F",padding:"2px 10px",borderRadius:20,fontFamily:"'Jost',sans-serif"}}>Active</span>}
                      </div>
                      <div className="discount-row">
                        <div className="form-group" style={{margin:0}}>
                          <label className="form-label">Type</label>
                          <select className="form-select" value={newProd.discountType}
                            onChange={e=>setNewProd(f=>({...f,discountType:e.target.value}))}>
                            <option value="percent">% Percentage</option>
                            <option value="flat">৳ Flat Amount</option>
                          </select>
                        </div>
                        <div className="form-group" style={{margin:0}}>
                          <label className="form-label">{newProd.discountType==="percent"?"Discount (%)":"Discount (৳)"}</label>
                          <input className="form-input" type="number" min="0"
                            max={newProd.discountType==="percent"?"100":undefined}
                            placeholder={newProd.discountType==="percent"?"e.g. 20":"e.g. 500"}
                            value={newProd.discount}
                            onChange={e=>setNewProd(f=>({...f,discount:e.target.value}))}/>
                        </div>
                      </div>
                      {newProd.price&&Number(newProd.discount)>0&&(()=>{
                        const orig = Number(newProd.price);
                        const disc = Number(newProd.discount);
                        const final = newProd.discountType==="percent" ? Math.round(orig*(1-disc/100)) : Math.max(0,orig-disc);
                        const saved = orig-final;
                        return (
                          <div className="discount-preview">
                            <span>🎉</span>
                            <span>৳{orig.toLocaleString()} → <strong>৳{final.toLocaleString()}</strong> &nbsp;·&nbsp; Customer saves ৳{saved.toLocaleString()}</span>
                          </div>
                        );
                      })()}
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:10}}>Set to 0 to remove any discount from this product.</div>
                    </div>
                    <div className="full" style={{display:"flex",gap:12}}>
                      <button className="save-btn" onClick={saveProduct}>{editId?"Update Product":"Add Product"}</button>
                      {editId&&<button className="action-btn" onClick={()=>{setEditId(null);setNewProd({name:"",category:categories[0]?.id||"",price:"",emoji:"🛍️",image:null,images:[],desc:"",features:"",discount:"0",discountType:"percent",stock:"",freeDelivery:false});}}>Cancel</button>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {adminTab==="payments"&&(
              <div className="fade-up">
                <div className="admin-header">
                  <div className="admin-title">Payment Settings</div>
                  <div className="admin-subtitle">Manage payment methods and bKash configuration</div>
                </div>
                <div className="admin-card">
                  <div className="admin-card-title">Payment Methods</div>
                  {payments.map(pm=>(
                    <div key={pm.id} className="payment-method-row">
                      <div className="pm-info">
                        <span className="pm-icon">{pm.icon}</span>
                        <div>
                          <div className="pm-name">{pm.name}</div>
                          <div className="pm-desc">{pm.desc}</div>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={pm.enabled}
                          onChange={()=>togglePayment(pm)}/>
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}

                  {/* ── BKASH NUMBER SETTING ── */}
                  <div className="bkash-config-box">
                    <div className="bkash-config-header">
                      <span className="bkash-config-title">📱 Your bKash Merchant Number</span>
                      {bkashSaved&&<span className="bkash-config-saved">✓ Saved</span>}
                    </div>
                    <div className="bkash-config-desc">
                      This number is displayed to customers when they choose <strong>bKash (Manual)</strong> at checkout. They'll send payment to this number and submit their Transaction ID.
                    </div>
                    <div className="bkash-config-row">
                      <input className="bkash-number-field" placeholder="01XXXXXXXXX"
                        value={bkashDraft} onChange={e=>setBkashDraft(e.target.value.replace(/\D/g,""))} maxLength={11} inputMode="numeric"/>
                      <button className="bkash-save-btn" onClick={saveBkashNumber}>Save Number</button>
                    </div>
                    <div className="bkash-config-current">
                      Active number: <strong>{bkashNumber}</strong>
                    </div>
                  </div>

                  {/* ── PAYMENT GATEWAY CONFIG ── */}
                  <div className="gateway-config-box">
                    <div className="gateway-config-header">
                      <span className="gateway-config-title">🔐 Payment Gateway Configuration</span>
                      {gateway.configured&&<span className="gateway-config-saved">✓ Configured</span>}
                    </div>
                    <div className="gateway-config-desc">
                      Configure your payment gateway so customers can pay online with cards, bKash, and Nagad. Enable "Online Payment Gateway" above to activate it at checkout.
                    </div>

                    {/* Provider selector */}
                    <div style={{fontSize:12,color:"var(--muted)",marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>Select Provider</div>
                    <div className="gateway-provider-grid">
                      {GATEWAY_PROVIDERS.map(gp=>(
                        <div key={gp.id} className={`gateway-provider-card ${gatewayDraft.provider===gp.id?"selected":""}`}
                          onClick={()=>setGatewayDraft(f=>({...f,provider:gp.id}))}>
                          <div className="gateway-provider-icon">{gp.icon}</div>
                          <div className="gateway-provider-name">{gp.name}</div>
                        </div>
                      ))}
                    </div>

                    {/* Mode toggle */}
                    <div className="gateway-mode-row">
                      <span style={{fontSize:12,color:"var(--muted)"}}>Mode:</span>
                      {["test","live"].map(m=>(
                        <button key={m} className={`mode-pill ${gatewayDraft.mode===m?`active ${m}`:""}`}
                          onClick={()=>setGatewayDraft(f=>({...f,mode:m}))}>
                          {m==="test"?"🧪 Test":"🟢 Live"}
                        </button>
                      ))}
                      {gatewayDraft.mode==="test"&&<span style={{fontSize:11,color:"var(--gold)"}}>No real charges in test mode</span>}
                      {gatewayDraft.mode==="live"&&<span style={{fontSize:11,color:"var(--sage-dark)"}}>Real transactions active</span>}
                    </div>

                    {/* Credentials */}
                    <div className="gateway-fields">
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Merchant ID / Store ID</label>
                        <input className="form-input" placeholder="e.g. viventra_store_01"
                          value={gatewayDraft.merchantId} onChange={e=>setGatewayDraft(f=>({...f,merchantId:e.target.value}))}/>
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">API Key / Secret</label>
                        <input className="form-input" type="password" placeholder="••••••••••••••••"
                          value={gatewayDraft.apiKey} onChange={e=>setGatewayDraft(f=>({...f,apiKey:e.target.value}))}/>
                      </div>
                    </div>

                    <button className="gateway-save-btn" onClick={saveGateway}>Save Gateway Config</button>

                    {gateway.configured&&(
                      <div className="gateway-status-row">
                        <div className="gateway-dot" style={{background:gateway.mode==="live"?"var(--sage)":"var(--gold)"}}/>
                        <span>
                          <strong>{GATEWAY_PROVIDERS.find(g=>g.id===gateway.provider)?.name}</strong> ·{" "}
                          {gateway.mode==="live"?"Live mode":"Test mode"} · Merchant: {gateway.merchantId}
                        </span>
                      </div>
                    )}
                    <div style={{marginTop:12,fontSize:11,color:"var(--muted)",lineHeight:1.7}}>
                      ℹ️ Real payment processing requires server-side integration. This UI configuration prepares your storefront — connect your backend to activate live transactions.
                    </div>
                  </div>
                </div>

                <div className="admin-card" style={{marginTop:24}}>
                  <div className="admin-card-title">🛡️ Conditional COD</div>
                  <div style={{fontSize:13,color:"var(--brown-light)",marginBottom:20,lineHeight:1.7}}>
                    Protect against fake COD orders from distant areas. When ON, customers ordering Cash on Delivery to <strong>non-local zones</strong> must pay the delivery charge in advance via bKash. The product cost stays COD.
                  </div>

                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",background:"var(--linen)",border:"1px solid var(--linen2)",borderRadius:"var(--radius-sm)",marginBottom:20}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:500,color:"var(--brown)",marginBottom:2}}>
                        {conditionalCod ? "Conditional COD: ON" : "Conditional COD: OFF"}
                      </div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>
                        {conditionalCod
                          ? "Outside-Dhaka COD orders require advance bKash payment for delivery"
                          : "All COD orders accepted normally"}
                      </div>
                    </div>
                    <button
                      onClick={()=>{
                        toggleConditionalCod();
                        toast2(conditionalCod ? "Conditional COD turned off" : "✓ Conditional COD enabled");
                      }}
                      style={{
                        background:conditionalCod?"var(--sage-dark)":"var(--linen2)",
                        color:conditionalCod?"white":"var(--brown-light)",
                        border:"none",padding:"8px 18px",borderRadius:20,
                        fontSize:12,fontWeight:600,letterSpacing:1,cursor:"pointer",
                        transition:"all 0.2s",minWidth:80
                      }}>
                      {conditionalCod?"ON":"OFF"}
                    </button>
                  </div>

                  {conditionalCod && (
                    <>
                      <div style={{padding:"14px 16px",background:"rgba(122,158,126,0.08)",border:"1px solid rgba(122,158,126,0.25)",borderRadius:"var(--radius-sm)",fontSize:12,color:"var(--brown-light)",lineHeight:1.7,marginBottom:16}}>
                        <strong style={{color:"var(--sage-dark)"}}>How it works:</strong>
                        <ul style={{margin:"8px 0 0 18px",padding:0}}>
                          <li>Customers in <strong>local zones</strong> (e.g. Dhaka Inside) can order COD normally.</li>
                          <li>Customers in <strong>non-local zones</strong> who pick COD will see a notice asking them to pay just the delivery charge via bKash first.</li>
                          <li>They enter the bKash Transaction ID before the order is placed.</li>
                          <li>You collect the rest (product cost) when delivering.</li>
                        </ul>
                      </div>
                      <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>
                        Mark your local zones in the <strong>Delivery Zones</strong> tab. Currently <strong>{zones.filter(z=>z.isLocal).length}</strong> zone(s) marked local, <strong>{zones.filter(z=>!z.isLocal).length}</strong> require advance payment.
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Zones */}
            {adminTab==="delivery"&&(
              <div className="fade-up">
                <div className="admin-header">
                  <div className="admin-title">Delivery Zones</div>
                  <div className="admin-subtitle">Set delivery charges for different locations across Bangladesh</div>
                </div>
                <div className="admin-card">
                  <div className="admin-card-title">Active Zones ({zones.length})</div>
                  <div className="zone-list">
                    {zones.map(z=>(
                      <div key={z.id} className="zone-row">
                        <div className="zone-row-left">
                          <span className="zone-icon">📍</span>
                          <span className="zone-name">{z.name}</span>
                          {z.isLocal && (
                            <span style={{marginLeft:10,padding:"2px 8px",background:"rgba(122,158,126,0.15)",color:"var(--sage-dark)",borderRadius:10,fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Local</span>
                          )}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <span className="zone-charge">৳{z.charge} delivery</span>
                          <button
                            onClick={()=>toggleZoneLocal(z)}
                            style={{
                              background:z.isLocal?"var(--sage-dark)":"var(--linen2)",
                              color:z.isLocal?"white":"var(--brown-light)",
                              border:"none",padding:"6px 14px",borderRadius:14,
                              fontSize:11,fontWeight:600,letterSpacing:0.5,cursor:"pointer",
                              transition:"all 0.2s"
                            }}
                            title="Toggle local status (affects Conditional COD)"
                          >
                            {z.isLocal?"✓ Local":"Mark Local"}
                          </button>
                          <button className="action-btn danger"
                            onClick={()=>removeZone(z.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {zones.length===0&&(
                      <div style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:14}}>
                        No zones yet — add your first delivery zone below.
                      </div>
                    )}
                  </div>
                  <div style={{borderTop:"1px solid var(--linen2)",paddingTop:24}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:"var(--brown)",marginBottom:16}}>Add New Zone</div>
                    <div className="zone-add-row">
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Location Name</label>
                        <input className="form-input" placeholder="e.g. Barishal"
                          value={zoneForm.name} onChange={e=>setZoneForm(f=>({...f,name:e.target.value}))}
                          onKeyDown={e=>{ if(e.key==="Enter"&&zoneForm.name&&zoneForm.charge) addZone(); }}/>
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Charge (৳)</label>
                        <input className="form-input" type="number" placeholder="e.g. 120"
                          value={zoneForm.charge} onChange={e=>setZoneForm(f=>({...f,charge:e.target.value}))}/>
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label" style={{visibility:"hidden"}}>x</label>
                        <button className="zone-add-btn" onClick={addZone}>+ Add Zone</button>
                      </div>
                    </div>
                    <label style={{display:"flex",alignItems:"center",gap:8,marginTop:14,cursor:"pointer",fontSize:13,color:"var(--brown-light)"}}>
                      <input type="checkbox" checked={zoneForm.isLocal} onChange={e=>setZoneForm(f=>({...f,isLocal:e.target.checked}))} style={{cursor:"pointer"}}/>
                      Mark as <strong style={{color:"var(--sage-dark)"}}>local zone</strong> (exempt from Conditional COD advance payment)
                    </label>
                    <div style={{marginTop:16,padding:"12px 16px",background:"var(--linen)",borderRadius:"var(--radius-sm)",fontSize:12,color:"var(--muted)"}}>
                      💡 Customers select their zone at checkout — the charge is automatically added to their order total. Mark zones near you (e.g. your city) as <em>Local</em> to exempt them from advance payment when Conditional COD is on.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account & Security */}
            {adminTab==="account"&&(
              <div className="fade-up">
                <div className="admin-header">
                  <div className="admin-title">Account & Security</div>
                  <div className="admin-subtitle">Update your admin login credentials</div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-title">Current Account</div>
                  <div style={{display:"flex",gap:24,padding:"16px 0",borderBottom:"1px solid var(--linen2)",marginBottom:24}}>
                    <div>
                      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"var(--muted)",marginBottom:4}}>Signed in as</div>
                      <div style={{fontSize:18,fontWeight:500,color:"var(--brown)"}}>{adminEmail || "—"}</div>
                    </div>
                  </div>

                  <div className="admin-card-title" style={{fontSize:18}}>Change Credentials</div>

                  <div className="form-group" style={{maxWidth:480}}>
                    <label className="form-label">Current Password *</label>
                    <input className="form-input" type="password" placeholder="Enter your current password"
                      value={pwForm.current}
                      onChange={e=>setPwForm(f=>({...f,current:e.target.value}))}/>
                  </div>

                  <div style={{height:1,background:"var(--linen2)",margin:"24px 0"}}/>

                  <div style={{fontSize:13,color:"var(--brown-light)",marginBottom:16}}>
                    Leave the email blank to keep <strong>{adminEmail}</strong>.
                  </div>

                  <div className="form-group" style={{maxWidth:480}}>
                    <label className="form-label">New Email (optional)</label>
                    <input className="form-input" type="email" placeholder={adminEmail}
                      value={pwForm.newEmail}
                      onChange={e=>setPwForm(f=>({...f,newEmail:e.target.value}))}/>
                  </div>

                  <div className="form-group" style={{maxWidth:480}}>
                    <label className="form-label">New Password *</label>
                    <input className="form-input" type="password" placeholder="At least 6 characters"
                      value={pwForm.newPassword}
                      onChange={e=>setPwForm(f=>({...f,newPassword:e.target.value}))}/>
                    {pwForm.newPassword&&(
                      <div style={{marginTop:8,fontSize:12}}>
                        {(()=>{
                          const p = pwForm.newPassword;
                          const score = (p.length>=8?1:0)+(/[A-Z]/.test(p)?1:0)+(/[0-9]/.test(p)?1:0)+(/[^A-Za-z0-9]/.test(p)?1:0);
                          const labels = ["Weak","Fair","Good","Strong"];
                          const colors = ["#E8384F","#C4963C","#7A9E7E","#5C8060"];
                          if(p.length<6) return <span style={{color:"#E8384F"}}>⚠ Too short — at least 6 characters required</span>;
                          return <span style={{color:colors[score-1]||colors[0]}}>● Strength: {labels[score-1]||labels[0]}</span>;
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{maxWidth:480}}>
                    <label className="form-label">Confirm New Password *</label>
                    <input className="form-input" type="password" placeholder="Re-enter new password"
                      value={pwForm.confirm}
                      onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))}/>
                    {pwForm.confirm&&pwForm.newPassword&&pwForm.confirm!==pwForm.newPassword&&(
                      <div style={{marginTop:8,fontSize:12,color:"#E8384F"}}>⚠ Passwords do not match</div>
                    )}
                    {pwForm.confirm&&pwForm.newPassword&&pwForm.confirm===pwForm.newPassword&&pwForm.newPassword.length>=6&&(
                      <div style={{marginTop:8,fontSize:12,color:"var(--sage-dark)"}}>✓ Passwords match</div>
                    )}
                  </div>

                  <div style={{display:"flex",gap:12,marginTop:8}}>
                    <button className="save-btn" onClick={changeAdminCreds}>Update Credentials</button>
                    <button className="action-btn" onClick={()=>setPwForm({current:"",newEmail:"",newPassword:"",confirm:""})}>Clear</button>
                  </div>

                  <div style={{marginTop:28,padding:"14px 16px",background:"rgba(196,150,60,0.08)",border:"1px solid rgba(196,150,60,0.25)",borderRadius:"var(--radius-sm)",fontSize:12,color:"var(--brown-light)",lineHeight:1.7}}>
                    <strong style={{color:"var(--gold)"}}>🔒 Backed by Supabase Auth.</strong> Credentials live in your Supabase project, not in the browser — an email change requires confirming the new address before it takes effect.
                  </div>
                </div>

                <div className="admin-card" style={{marginTop:24}}>
                  <div className="admin-card-title">🔗 Hidden Access URL</div>
                  <div style={{fontSize:13,color:"var(--brown-light)",marginBottom:20,lineHeight:1.7}}>
                    Customers cannot see any link to this admin panel. To get back in, you must use one of these two methods:
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
                    <div style={{padding:"16px",background:"var(--linen)",border:"1px solid var(--linen2)",borderRadius:"var(--radius-sm)"}}>
                      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"var(--terra)",fontWeight:600,marginBottom:8}}>Method 1 · URL</div>
                      <div style={{fontSize:13,color:"var(--brown-light)",lineHeight:1.7,marginBottom:8}}>Add this to the end of your store URL:</div>
                      <code style={{display:"block",padding:"8px 10px",background:"white",border:"1px solid var(--linen2)",borderRadius:4,fontSize:12,color:"var(--brown)",wordBreak:"break-all"}}>yoursite.com/{adminHashSecret}</code>
                    </div>
                    <div style={{padding:"16px",background:"var(--linen)",border:"1px solid var(--linen2)",borderRadius:"var(--radius-sm)"}}>
                      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"var(--terra)",fontWeight:600,marginBottom:8}}>Method 2 · Gesture</div>
                      <div style={{fontSize:13,color:"var(--brown-light)",lineHeight:1.7}}>
                        Click the <strong>© 2024 VIVENTRA</strong> copyright text in the footer <strong>5 times within 3 seconds</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{maxWidth:480}}>
                    <label className="form-label">Change the secret keyword</label>
                    <div style={{display:"flex",alignItems:"center",gap:0,border:"1.5px solid var(--linen2)",borderRadius:"var(--radius-sm)",background:"var(--linen)",overflow:"hidden"}}>
                      <span style={{padding:"12px 8px 12px 14px",fontSize:14,color:"var(--muted)",fontFamily:"monospace"}}>#</span>
                      <input
                        style={{flex:1,padding:"12px 14px 12px 0",border:"none",background:"transparent",fontFamily:"monospace",fontSize:14,color:"var(--brown)",outline:"none"}}
                        placeholder="vadmin-2024"
                        value={hashDraft}
                        onChange={e=>setHashDraft(e.target.value.replace(/[^A-Za-z0-9_-]/g,""))}
                        maxLength={32}
                      />
                    </div>
                    <div style={{fontSize:11,color:"var(--muted)",marginTop:8,lineHeight:1.6}}>
                      Letters, numbers, dashes, underscores · 4–32 characters · Case-sensitive
                    </div>
                  </div>

                  <div style={{display:"flex",gap:12}}>
                    <button className="save-btn" onClick={updateAdminHash}>Update Secret URL</button>
                    <button className="action-btn" onClick={()=>setHashDraft(adminHashSecret.replace(/^#/,""))}>Reset</button>
                  </div>

                  <div style={{marginTop:24,padding:"14px 16px",background:"rgba(232,56,79,0.06)",border:"1px solid rgba(232,56,79,0.2)",borderRadius:"var(--radius-sm)",fontSize:12,color:"var(--brown-light)",lineHeight:1.7}}>
                    <strong style={{color:"#E8384F"}}>⚠ Don't forget your secret URL.</strong> It's saved in your database, so it survives refreshes — but if you forget it, you'll need to update the <code>admin_hash_secret</code> value directly in Supabase to get back in.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ PAYMENT GATEWAY MODAL ══════════════════════════════════════════ */}
      {showPayModal&&(
        <div className="modal-overlay" onClick={e=>{ if(payStep!=="processing"&&e.target===e.currentTarget){ setShowPayModal(false); setPayStep("form"); }}}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-header-left">
                <span className="modal-lock">🔐</span>
                <div>
                  <div className="modal-title">Secure Payment</div>
                  <div className="modal-amount">৳{orderTotal.toLocaleString()} · VIVENTRA</div>
                </div>
              </div>
              {payStep!=="processing"&&(
                <button className="modal-close" onClick={()=>{ setShowPayModal(false); setPayStep("form"); }}>✕</button>
              )}
            </div>
            <div className="modal-body">
              {payStep==="form"&&(
                <>
                  <div className="modal-provider-row">
                    <span className="modal-provider-label">Powered by</span>
                    <span style={{fontSize:16,margin:"0 6px"}}>{activeGatewayProvider.icon}</span>
                    <span className="modal-provider-name">{activeGatewayProvider.name}</span>
                    <span style={{marginLeft:"auto",fontSize:11,color:"var(--muted)"}}>
                      {gateway.mode==="test"?"🧪 Test Mode":"🟢 Live"}
                    </span>
                  </div>
                  <div className="card-field-group">
                    <label className="card-field-label">Card Number</label>
                    <input className="card-field-input" placeholder="1234 5678 9012 3456" maxLength={19}
                      value={cardForm.number}
                      onChange={e=>{ const v=e.target.value.replace(/\D/g,"").slice(0,16); setCardForm(f=>({...f,number:v.replace(/(.{4})/g,"$1 ").trim()})); }}/>
                  </div>
                  <div className="card-field-group">
                    <label className="card-field-label">Cardholder Name</label>
                    <input className="card-field-input" placeholder="Name as on card"
                      value={cardForm.name} onChange={e=>setCardForm(f=>({...f,name:e.target.value}))} style={{letterSpacing:"normal"}}/>
                  </div>
                  <div className="card-row">
                    <div className="card-field-group">
                      <label className="card-field-label">Expiry</label>
                      <input className="card-field-input" placeholder="MM / YY" maxLength={7}
                        value={cardForm.expiry}
                        onChange={e=>{ let v=e.target.value.replace(/\D/g,""); if(v.length>2) v=v.slice(0,2)+" / "+v.slice(2,4); setCardForm(f=>({...f,expiry:v})); }}/>
                    </div>
                    <div className="card-field-group">
                      <label className="card-field-label">CVV</label>
                      <input className="card-field-input" placeholder="•••" maxLength={4} type="password"
                        value={cardForm.cvv} onChange={e=>setCardForm(f=>({...f,cvv:e.target.value.replace(/\D/g,"")}))}/>
                    </div>
                  </div>
                  <button className="pay-modal-btn" onClick={simulatePay}>
                    Pay ৳{orderTotal.toLocaleString()} Now
                  </button>
                  <div className="secure-note" style={{marginTop:14}}>🔒 Your card info is encrypted and never stored</div>
                </>
              )}
              {payStep==="processing"&&(
                <div className="processing-box">
                  <div className="processing-spinner"/>
                  <div className="processing-text">Processing Payment…</div>
                  <div className="processing-sub">Please don't close this window</div>
                </div>
              )}
              {payStep==="done"&&(
                <div className="done-box">
                  <div className="done-icon">✅</div>
                  <div className="done-title">Payment Successful!</div>
                  <div className="done-sub">
                    ৳{orderTotal.toLocaleString()} paid via <strong>{activeGatewayProvider.name}</strong>.<br/>
                    Your order is confirmed.
                  </div>
                  <button className="done-btn" onClick={confirmGatewayOrder}>View Order Confirmation</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ STOREFRONT ═════════════════════════════════════════════════════ */}
      {!["admin","admin-login"].includes(page)&&(
        <>
          {/* NAV */}
          <nav className="nav">
            <div className="nav-logo" onClick={()=>{nav("home");setActiveCat("all");}}>
              <img src={LOGO_BADGE} alt="Viventra logo" style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",boxShadow:"0 1px 3px rgba(61,43,31,0.15)"}}/>
              <div>
                <div className="nav-logo-text">VIVENTRA</div>
                <div className="nav-logo-sub">Aesthetic Living</div>
              </div>
            </div>
            <div className="nav-links">
              {categories.map(c=>(
                <button key={c.id} className={`nav-link ${activeCat===c.id&&page==="shop"?"active":""}`}
                  onClick={()=>{setActiveCat(c.id);nav("shop");}}>
                  {c.name}
                </button>
              ))}
              <button className="nav-link" onClick={()=>{setActiveCat("all");nav("shop");}}>All</button>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <button className="nav-cart-btn" onClick={()=>nav("cart")}>
                🛒 Cart {cartCount>0&&<span className="badge">{cartCount}</span>}
              </button>
            </div>
          </nav>

          {/* HOME */}
          {page==="home"&&(
            <>
              <div className="hero fade-in">
                <div className="hero-content">
                  <div className="hero-eyebrow">Aesthetic Living — Est. 2026</div>
                  <h1 className="hero-title">Design your<br/><em>sanctuary.</em></h1>
                  <p className="hero-desc">Curated home decor for those who believe every corner deserves intention. Timeless pieces, mindfully made.</p>
                  <div className="hero-btns">
                    <button className="btn-primary" onClick={()=>{setActiveCat("all");nav("shop");}}>Shop Collection</button>
                  </div>
                </div>
                <div className="hero-visual">
                  <div style={{padding:40,transform:"rotate(-2deg)",position:"relative"}}>
                    <img src={COVER_PHOTO} alt="Viventra lifestyle"
                      style={{width:"100%",maxWidth:520,borderRadius:14,boxShadow:"0 16px 48px rgba(61,43,31,0.22)",display:"block"}}/>
                  </div>
                </div>
              </div>
              <div className="section" style={{background:"#FDFAF6"}}>
                <div className="section-header">
                  <div className="section-label">Browse By</div>
                  <div className="section-title">Product Categories</div>
                  <div className="section-divider"></div>
                </div>
                <div className="categories-grid">
                  {categories.map(c=>(
                    <div key={c.id} className="category-card fade-up" onClick={()=>{setActiveCat(c.id);nav("shop");}}>
                      <div className="cat-icon">{c.icon}</div>
                      <div className="cat-name">{c.name}</div>
                      <div className="cat-count">{products.filter(p=>p.category===c.id&&p.visible).length} items</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="section" style={{background:"var(--linen2)"}}>
                <div className="section-header">
                  <div className="section-label">Handpicked</div>
                  <div className="section-title">Featured Products</div>
                  <div className="section-divider"></div>
                </div>
                <div className="products-grid">
                  {(() => {
                    const featured = products.filter(p=>p.visible&&p.badge);
                    const list = featured.length > 0 ? featured : products.filter(p=>p.visible).slice(0,4);
                    return list.map((p,i)=>(
                      <ProductCard key={p.id} product={p} index={i}
                        onView={()=>{setSelProd(p);setQty(1);setGalleryIndex(0);setLightboxOpen(false);nav("product");}}
                        onAdd={()=>addToCart(p)}
                        getFinalPrice={getFinalPrice} hasDiscount={hasDiscount} getSavings={getSavings}/>
                    ));
                  })()}
                </div>
                <div style={{textAlign:"center",marginTop:48}}>
                  <button className="btn-primary" onClick={()=>{setActiveCat("all");nav("shop");}}>View All Products</button>
                </div>
              </div>
            </>
          )}

          {/* SHOP */}
          {page==="shop"&&(
            <div className="section fade-up">
              <div className="section-header">
                <div className="section-label">Our Collection</div>
                <div className="section-title">{activeCat==="all"?"All Products":categories.find(c=>c.id===activeCat)?.name}</div>
                <div className="section-divider"></div>
              </div>
              <div className="filter-tabs">
                {[{id:"all",name:"All"},...categories].map(c=>(
                  <button key={c.id} className={`filter-tab ${activeCat===c.id?"active":""}`} onClick={()=>setActiveCat(c.id)}>{c.name}</button>
                ))}
              </div>
              <div className="products-grid">
                {products.filter(p=>p.visible&&(activeCat==="all"||p.category===activeCat)).map((p,i)=>(
                  <ProductCard key={p.id} product={p} index={i}
                    onView={()=>{setSelProd(p);setQty(1);setGalleryIndex(0);setLightboxOpen(false);nav("product");}}
                    onAdd={()=>addToCart(p)}
                    getFinalPrice={getFinalPrice} hasDiscount={hasDiscount} getSavings={getSavings}/>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCT DETAIL */}
          {page==="product"&&selProd&&(
            <div style={{paddingTop:20}} className="fade-in">
              <div style={{padding:"0 32px"}}>
                <button className="back-btn" onClick={()=>nav("shop")}>← Back to Shop</button>
              </div>
              <div className="product-detail">
                <div>
                  {(() => {
                    const gallery = [selProd.image, ...(selProd.images||[])].filter(Boolean);
                    const activeSrc = gallery[galleryIndex] || gallery[0];
                    return (
                      <>
                        <div className="detail-img-container" style={activeSrc?{cursor:"zoom-in"}:undefined} onClick={()=>activeSrc&&setLightboxOpen(true)}>
                          {activeSrc
                            ?<img src={activeSrc} alt={selProd.name} className="detail-img-photo"/>
                            :<div className="detail-img-emoji">{selProd.emoji}</div>
                          }
                          {activeSrc && <div className="zoom-hint">🔍 Tap to zoom</div>}
                          <div className="zoom-preview">
                            {activeSrc
                              ?<img src={activeSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                              :<span style={{fontSize:56}}>{selProd.emoji}</span>
                            }
                          </div>
                        </div>
                        {gallery.length>1 && (
                          <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                            {gallery.map((src,i)=>(
                              <button key={i} onClick={()=>setGalleryIndex(i)}
                                style={{width:56,height:56,padding:0,border:i===galleryIndex?"2px solid var(--terra)":"2px solid transparent",borderRadius:8,overflow:"hidden",cursor:"pointer",background:"none"}}>
                                <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                              </button>
                            ))}
                          </div>
                        )}
                        {lightboxOpen && activeSrc && (
                          <div className="lightbox-overlay" onClick={()=>setLightboxOpen(false)}>
                            <button className="lightbox-close" onClick={(e)=>{e.stopPropagation();setLightboxOpen(false);}}>✕</button>
                            {gallery.length>1 && (
                              <button className="lightbox-nav lightbox-prev" onClick={(e)=>{e.stopPropagation();setGalleryIndex(i=>(i-1+gallery.length)%gallery.length);}}>‹</button>
                            )}
                            <img src={activeSrc} alt={selProd.name} className="lightbox-img" onClick={e=>e.stopPropagation()}/>
                            {gallery.length>1 && (
                              <button className="lightbox-nav lightbox-next" onClick={(e)=>{e.stopPropagation();setGalleryIndex(i=>(i+1)%gallery.length);}}>›</button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div>
                  <div className="detail-eyebrow">{selProd.category.replace("-"," ")}</div>
                  <h1 className="detail-title">{selProd.name}</h1>
                  {selProd.badge&&<span style={{fontSize:11,background:"var(--terra)",color:"white",padding:"4px 14px",borderRadius:20,textTransform:"uppercase",fontWeight:500,display:"inline-block",marginBottom:16,letterSpacing:1}}>{selProd.badge}</span>}
                  <div className="detail-price-block">
                    {hasDiscount(selProd)&&(
                      <div className="detail-price-original">৳{selProd.price.toLocaleString()}</div>
                    )}
                    <div className={`detail-price-final ${hasDiscount(selProd)?"":"no-discount"}`}>
                      ৳{getFinalPrice(selProd).toLocaleString()}
                    </div>
                    {hasDiscount(selProd)&&(
                      <div className="detail-savings-tag">
                        🏷️ You save ৳{getSavings(selProd).toLocaleString()}
                        {selProd.discountType==="percent"?` (${selProd.discount}% off)`:` (৳${selProd.discount} off)`}
                      </div>
                    )}
                    {selProd.freeDelivery&&(
                      <div style={{marginTop:8,fontSize:13,fontWeight:600,color:"var(--sage-dark)",display:"flex",alignItems:"center",gap:6}}>
                        🚚 Free Delivery on this item
                      </div>
                    )}
                  </div>
                  <div className="detail-divider"/>
                  <p className="detail-desc">{selProd.desc}</p>
                  {selProd.features?.length>0&&(
                    <div className="detail-features">
                      {selProd.features.map((f,i)=><div key={i} className="detail-feature"><span className="feature-dot">◆</span>{f}</div>)}
                    </div>
                  )}
                  {(() => {
                    const tracked = selProd.stock !== null && selProd.stock !== undefined;
                    const outOfStock = tracked && Number(selProd.stock) <= 0;
                    const maxQty = tracked ? Math.max(1, Number(selProd.stock)) : Infinity;
                    if (outOfStock) {
                      return (
                        <div className="detail-btn-row">
                          <div style={{padding:"14px 20px",background:"rgba(232,56,79,0.08)",color:"#E8384F",borderRadius:10,fontWeight:600,textAlign:"center",width:"100%"}}>
                            Currently Out of Stock
                          </div>
                        </div>
                      );
                    }
                    return (
                      <>
                        {tracked && Number(selProd.stock) <= 5 && (
                          <div style={{color:"#C77A2E",fontSize:13,fontWeight:600,marginBottom:8}}>Only {selProd.stock} left in stock</div>
                        )}
                        <div className="qty-row">
                          <span className="qty-label">Quantity</span>
                          <div className="qty-control">
                            <button className="qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                            <span className="qty-num">{qty}</span>
                            <button className="qty-btn" onClick={()=>setQty(q=>Math.min(maxQty,q+1))}>+</button>
                          </div>
                        </div>
                        <div className="detail-btn-row">
                          <button className="detail-add-btn" onClick={()=>addToCart(selProd,qty)}>
                            🛒 Add to Cart
                          </button>
                          <button className="detail-buy-btn" onClick={()=>{addToCart(selProd,qty);nav("checkout");}}>
                            ⚡ Buy Now — ৳{(getFinalPrice(selProd)*qty).toLocaleString()}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* CART */}
          {page==="cart"&&(
            <div className="page-container fade-up">
              <h1 className="page-title">Your Cart</h1>
              {cart.length===0?(
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <div className="empty-text">Your cart is empty</div>
                  <button className="btn-primary" onClick={()=>nav("shop")}>Browse Products</button>
                </div>
              ):(
                <div className="cart-layout">
                  <div>
                    {cart.map(item=>(
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-thumb">
                          {item.image?<img src={item.image} alt={item.name}/>:item.emoji}
                        </div>
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.name}</div>
                          <div className="cart-item-cat">{item.category.replace("-"," ")} · Qty: {item.qty}</div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {hasDiscount(item)&&<span style={{fontSize:12,color:"var(--muted)",textDecoration:"line-through"}}>৳{item.price.toLocaleString()}</span>}
                            <span className="cart-item-price">৳{(getFinalPrice(item)*item.qty).toLocaleString()}</span>
                          </div>
                        </div>
                        <button className="cart-item-remove" onClick={()=>removeFromCart(item.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="order-summary">
                    <div className="summary-title">Order Summary</div>
                    {cart.map(i=>(
                      <div key={i.id} className="summary-row">
                        <span>{i.name} ×{i.qty}</span>
                        <span>৳{(getFinalPrice(i)*i.qty).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="summary-row"><span>Delivery</span><span style={{color:"var(--sage)"}}>Select at checkout</span></div>
                    <div className="summary-row total"><span>Total</span><span>৳{cartTotal.toLocaleString()}</span></div>
                    <button className="checkout-btn" onClick={()=>nav("checkout")}>Proceed to Checkout</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHECKOUT */}
          {page==="checkout"&&(
            <div className="page-container fade-up">
              <h1 className="page-title">Checkout</h1>
              <div className="checkout-grid">
                <div>
                  {/* Delivery */}
                  <div className="form-section" style={{marginBottom:24}}>
                    <div className="form-section-title">Delivery Information</div>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" placeholder="Your full name" value={checkout.name} onChange={e=>setCheckout(f=>({...f,name:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Delivery Address *</label>
                      <textarea className="form-input form-textarea" placeholder="House no., Road, Area, City" value={checkout.address} onChange={e=>setCheckout(f=>({...f,address:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number *</label>
                      <input className="form-input" placeholder="+880 1X XX XXX XXX" value={checkout.phone} onChange={e=>setCheckout(f=>({...f,phone:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Delivery Zone *</label>
                      <div className="zone-select-wrap">
                        <select className={`zone-select ${checkout.zoneId?"selected":""}`}
                          value={checkout.zoneId}
                          onChange={e=>setCheckout(f=>({...f,zoneId:e.target.value}))}>
                          <option value="">— Select your area —</option>
                          {zones.map(z=>(
                            <option key={z.id} value={z.id}>{z.name} — ৳{z.charge}</option>
                          ))}
                        </select>
                      </div>
                      {selectedZone&&(
                        <div className="zone-charge-badge">
                          <span>Delivery charge for <strong>{selectedZone.name}</strong>:</span>
                          {cartHasFreeDelivery
                            ? <span className="zone-charge-pill" style={{background:"rgba(122,158,126,0.15)",color:"var(--sage-dark)"}}>🚚 FREE</span>
                            : <span className="zone-charge-pill">৳{selectedZone.charge}</span>}
                        </div>
                      )}
                      {zones.length===0&&(
                        <div style={{fontSize:12,color:"var(--muted)",marginTop:6}}>No delivery zones configured yet. Contact the store.</div>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  {enabledPayments.length>0&&(
                    <div className="form-section" style={{marginBottom:24}}>
                      <div className="form-section-title">Payment Method</div>
                      <div className="payment-options">
                        {enabledPayments.map(pm=>(
                          <label key={pm.id} className={`payment-option ${checkout.payment===pm.id?"selected":""}`}>
                            <input type="radio" name="payment" value={pm.id} checked={checkout.payment===pm.id}
                              onChange={()=>setCheckout(f=>({...f,payment:pm.id,txnCode:""}))}/>
                            <span className="payment-icon">{pm.icon}</span>
                            <span className="payment-label">{pm.name}</span>
                          </label>
                        ))}
                      </div>

                      {/* ── MANUAL BKASH PANEL ── */}
                      {checkout.payment==="manual_bkash"&&(
                        <div className="bkash-panel">
                          <div className="bkash-panel-title">📱 bKash Payment</div>

                          {/* Mode toggle */}
                          <div className="bkash-mode-tabs">
                            <button className={`bkash-mode-tab ${!bkashPartialActive?"active":""}`}
                              onClick={()=>setCheckout(f=>({...f,bkashMode:"full",txnCode:""}))}>
                              💳 Full Payment<br/>
                              <span style={{fontSize:10,opacity:0.85}}>Pay entire order via bKash</span>
                            </button>
                            {!cartHasFreeDelivery&&(
                              <button className={`bkash-mode-tab ${bkashPartialActive?"active":""}`}
                                onClick={()=>setCheckout(f=>({...f,bkashMode:"partial",txnCode:""}))}>
                                🚚 Partial — Delivery Only<br/>
                                <span style={{fontSize:10,opacity:0.85}}>Pay delivery now, rest on arrival</span>
                              </button>
                            )}
                          </div>

                          {/* FULL PAYMENT mode */}
                          {!bkashPartialActive&&(
                            <>
                              <div style={{fontSize:12,color:"var(--brown-light)",marginBottom:12}}>
                                Send <strong style={{color:"#c0395a"}}>৳{orderTotal.toLocaleString()}</strong> to:
                              </div>
                              <div className="bkash-number-row">
                                <div className="bkash-number-box">{bkashNumber}</div>
                                <button className={`bkash-copy-btn ${copied?"copied":""}`} onClick={copyBkash}>
                                  <span className="copy-icon">{copied?"✓":"📋"}</span>
                                  <span>{copied?"Copied!":"Copy"}</span>
                                </button>
                              </div>
                              <ul className="bkash-steps">
                                <li>Open bKash → tap <strong>Send Money</strong></li>
                                <li>Enter the number above and amount <strong>৳{orderTotal.toLocaleString()}</strong></li>
                                <li>Reference: <strong>VIVENTRA</strong></li>
                                <li>Copy your <strong>Transaction ID</strong> from the confirmation</li>
                                <li>Paste it below, then place your order</li>
                              </ul>
                              <label className="txn-label">bKash Transaction ID *</label>
                              <input className="txn-input" placeholder="e.g. 8FK3D2ABCD"
                                value={checkout.txnCode}
                                onChange={e=>setCheckout(f=>({...f,txnCode:e.target.value.toUpperCase()}))}
                                maxLength={20}/>
                            </>
                          )}

                          {/* PARTIAL PAYMENT mode */}
                          {bkashPartialActive&&(
                            <>
                              <div className="partial-info-box">
                                Pay only the <strong>delivery charge</strong> now via bKash.
                                The <strong>product amount</strong> is paid in cash when your order arrives. 📦
                              </div>
                              {selectedZone?(
                                <>
                                  <div className="partial-amount-split">
                                    <div className="split-card bkash-part">
                                      <div className="split-label">Pay via bKash now</div>
                                      <div className="split-amount">৳{deliveryCharge.toLocaleString()}</div>
                                      <div className="split-desc">Delivery charge</div>
                                    </div>
                                    <div className="split-card cod-part">
                                      <div className="split-label">Pay cash on delivery</div>
                                      <div className="split-amount">৳{cartTotal.toLocaleString()}</div>
                                      <div className="split-desc">Product amount</div>
                                    </div>
                                  </div>
                                  <div style={{fontSize:12,color:"var(--brown-light)",marginBottom:12}}>
                                    Send <strong style={{color:"#c0395a"}}>৳{deliveryCharge.toLocaleString()}</strong> (delivery only) to:
                                  </div>
                                  <div className="bkash-number-row">
                                    <div className="bkash-number-box">{bkashNumber}</div>
                                    <button className={`bkash-copy-btn ${copied?"copied":""}`} onClick={copyBkash}>
                                      <span className="copy-icon">{copied?"✓":"📋"}</span>
                                      <span>{copied?"Copied!":"Copy"}</span>
                                    </button>
                                  </div>
                                  <ul className="bkash-steps">
                                    <li>Open bKash → tap <strong>Send Money</strong></li>
                                    <li>Send <strong>৳{deliveryCharge.toLocaleString()}</strong> (delivery charge only)</li>
                                    <li>Reference: <strong>VIVENTRA DELIVERY</strong></li>
                                    <li>Copy your <strong>Transaction ID</strong> from confirmation</li>
                                    <li>Paste below — product payment collected on delivery</li>
                                  </ul>
                                  <label className="txn-label">bKash Transaction ID *</label>
                                  <input className="txn-input" placeholder="e.g. 8FK3D2ABCD"
                                    value={checkout.txnCode}
                                    onChange={e=>setCheckout(f=>({...f,txnCode:e.target.value.toUpperCase()}))}
                                    maxLength={20}/>
                                </>
                              ):(
                                <div style={{textAlign:"center",padding:"16px",fontSize:13,color:"var(--muted)"}}>
                                  ⚠️ Please select a delivery zone above to see the delivery charge.
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* ── CONDITIONAL COD PANEL ── */}
                      {requiresConditionalCod&&(
                        <div className="bkash-panel" style={{borderLeftColor:"var(--gold)"}}>
                          <div className="bkash-panel-title" style={{color:"var(--gold)"}}>🛡️ Outside Dhaka — Advance Delivery Charge Required</div>

                          <div style={{padding:"14px 16px",background:"rgba(196,150,60,0.08)",border:"1px solid rgba(196,150,60,0.25)",borderRadius:"var(--radius-sm)",fontSize:13,color:"var(--brown-light)",lineHeight:1.7,marginBottom:18}}>
                            Because your delivery address is outside our local zone, we ask you to pay <strong>only the delivery charge</strong> in advance via bKash. The product cost stays Cash on Delivery and you pay it when your order arrives.
                          </div>

                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                            <div style={{padding:14,background:"var(--linen)",borderRadius:"var(--radius-sm)",textAlign:"center"}}>
                              <div style={{fontSize:10,letterSpacing:2,color:"var(--muted)",textTransform:"uppercase",marginBottom:4}}>Pay Now (bKash)</div>
                              <div style={{fontSize:22,fontWeight:600,color:"var(--gold)"}}>৳{deliveryCharge.toLocaleString()}</div>
                              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>delivery charge</div>
                            </div>
                            <div style={{padding:14,background:"var(--linen)",borderRadius:"var(--radius-sm)",textAlign:"center"}}>
                              <div style={{fontSize:10,letterSpacing:2,color:"var(--muted)",textTransform:"uppercase",marginBottom:4}}>Pay on Delivery</div>
                              <div style={{fontSize:22,fontWeight:600,color:"var(--brown)"}}>৳{cartTotal.toLocaleString()}</div>
                              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>product cost</div>
                            </div>
                          </div>

                          <div style={{padding:"14px 16px",background:"white",border:"1.5px dashed var(--gold)",borderRadius:"var(--radius-sm)",marginBottom:16}}>
                            <div style={{fontSize:11,letterSpacing:1.5,color:"var(--muted)",textTransform:"uppercase",marginBottom:6}}>Send Money to (Personal)</div>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <span style={{fontFamily:"monospace",fontSize:18,fontWeight:600,color:"var(--brown)"}}>{bkashNumber}</span>
                              <button className="action-btn" onClick={copyBkash}>{copied?"✓ Copied":"Copy"}</button>
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">bKash Transaction ID *</label>
                            <input className="form-input" placeholder="e.g. 8N7A2K9PQ1"
                              value={checkout.txnCode}
                              onChange={e=>setCheckout(f=>({...f,txnCode:e.target.value.toUpperCase()}))}
                              maxLength={16}/>
                            <div style={{fontSize:11,color:"var(--muted)",marginTop:6,lineHeight:1.6}}>
                              After sending ৳{deliveryCharge.toLocaleString()}, you'll receive a confirmation SMS. Enter the Transaction ID from that message.
                            </div>
                          </div>

                          {checkout.txnCode.trim()&&(
                            <div style={{padding:"10px 14px",background:"rgba(122,158,126,0.08)",border:"1px solid rgba(122,158,126,0.25)",borderRadius:"var(--radius-sm)",fontSize:12,color:"var(--sage-dark)"}}>
                              ✓ Transaction ID recorded. You can now place your order.
                            </div>
                          )}
                        </div>
                      )}
                      {/* ── GATEWAY PANEL ── */}
                      {checkout.payment==="gateway"&&(
                        <div className="gateway-panel">
                          <div className="gateway-panel-header">
                            <div className="gateway-panel-title">🔐 Secure Online Payment</div>
                            <span className="gateway-provider-badge">{activeGatewayProvider.icon} {activeGatewayProvider.name}</span>
                          </div>
                          <div style={{fontSize:12,color:"var(--brown-light)",marginBottom:10}}>Accepted payment methods:</div>
                          <div className="gateway-accepted">
                            {activeGatewayProvider.accepts.map(a=>(
                              <span key={a} className="gateway-chip">{a}</span>
                            ))}
                          </div>
                          <button className="pay-now-btn" onClick={async ()=>{
                            if(!checkout.name||!checkout.address||!checkout.phone){ toast2("⚠️ Fill delivery info first"); return; }
                            if(!checkout.zoneId){ toast2("⚠️ Select a delivery zone first"); return; }
                            if(!recaptchaToken){ toast2("⚠️ Please complete the verification checkbox"); return; }
                            await startGatewayCheckout();
                          }}>
                            🔐 Pay ৳{orderTotal.toLocaleString()} Securely
                          </button>
                          <div className="secure-note">🔒 256-bit SSL encrypted · Safe & secure checkout</div>
                        </div>
                      )}
                    </div>
                  )}
                  {enabledPayments.length>0&&(
                    <div className="form-section" style={{marginBottom:20}}>
                      <div className="form-section-title">Verify You're Human</div>
                      <div ref={recaptchaBoxRef}></div>
                    </div>
                  )}
                  {enabledPayments.length>0&&checkout.payment!=="gateway"&&(
                    <button className="checkout-btn" onClick={placeOrder}>
                      ✓ Place Order —{" "}
                      {(checkout.payment==="manual_bkash"&&bkashPartialActive)||requiresConditionalCod
                        ? `৳${deliveryCharge.toLocaleString()} bKash + ৳${cartTotal.toLocaleString()} COD`
                        : `৳${orderTotal.toLocaleString()}`}
                    </button>
                  )}
                </div>

                {/* Order Summary Sidebar */}
                <div className="order-summary" style={{alignSelf:"start"}}>
                  <div className="summary-title">Your Order</div>
                  {cart.map(i=>(
                    <div key={i.id} className="summary-row">
                      <span>{i.name} ×{i.qty}</span>
                      <span>৳{(getFinalPrice(i)*i.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>৳{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery {selectedZone?`(${selectedZone.name})`:""}</span>
                    <span style={{color:cartHasFreeDelivery?"var(--sage-dark)":selectedZone?"var(--terra)":"var(--muted)",fontWeight:cartHasFreeDelivery?600:400}}>
                      {cartHasFreeDelivery?"🚚 FREE":selectedZone?`৳${deliveryCharge.toLocaleString()}`:"— select zone"}
                    </span>
                  </div>
                  <div className="summary-row total"><span>Total</span><span>৳{orderTotal.toLocaleString()}</span></div>
                  {((checkout.payment==="manual_bkash"&&bkashPartialActive)||requiresConditionalCod)&&selectedZone&&(
                    <>
                      <div style={{height:1,background:"var(--linen2)",margin:"12px 0"}}/>
                      <div style={{fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>
                        {requiresConditionalCod ? "Payment Split (Conditional COD)" : "Payment Split"}
                      </div>
                      <div className="summary-row" style={{color:requiresConditionalCod?"var(--gold)":"#c0395a",fontWeight:500}}>
                        <span>📱 Pay via bKash now</span>
                        <span>৳{deliveryCharge.toLocaleString()}</span>
                      </div>
                      <div className="summary-row" style={{color:"var(--sage-dark)",fontWeight:500}}>
                        <span>💵 Pay cash on delivery</span>
                        <span>৳{cartTotal.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {page==="success"&&(
            <div className="success-page fade-in">
              <div className="success-icon">🎉</div>
              <h1 className="success-title">Order Placed!</h1>
              <p className="success-text">
                Thank you for shopping with <strong>VIVENTRA</strong>. We'll be in touch shortly with delivery details. Expect something beautiful at your door.
                {(checkout.payment==="manual_bkash"||requiresConditionalCod)&&checkout.txnCode&&(
                  <><br/><br/>
                    {(bkashPartialActive||requiresConditionalCod)?(
                      <>
                        <span style={{fontSize:13,color:"var(--muted)"}}>Delivery payment confirmed via bKash:</span><br/>
                        <strong style={{color:requiresConditionalCod?"var(--gold)":"#c0395a",fontSize:16,letterSpacing:2}}>{checkout.txnCode}</strong><br/><br/>
                        <span style={{fontSize:13,color:"var(--brown-light)"}}>
                          The product amount of <strong>৳{cartTotal.toLocaleString()}</strong> will be collected in cash when your order is delivered.
                        </span>
                      </>
                    ):(
                      <>
                        <span style={{fontSize:13,color:"var(--muted)"}}>bKash Transaction ID received:</span><br/>
                        <strong style={{color:"#c0395a",fontSize:16,letterSpacing:2}}>{checkout.txnCode}</strong>
                      </>
                    )}
                  </>
                )}
              </p>
              <button className="btn-primary" onClick={()=>{setCheckout({name:"",address:"",phone:"",payment:"cod",txnCode:"",zoneId:"",bkashMode:"full"});nav("home");}}>
                Continue Shopping
              </button>
            </div>
          )}

          {/* FOOTER */}
          {!["product","cart","checkout","success"].includes(page)&&(
            <footer style={{background:"var(--brown)",color:"rgba(255,255,255,0.7)",padding:"48px 32px",textAlign:"center"}}>
              <img src={LOGO_BADGE} alt="Viventra" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",marginBottom:16,boxShadow:"0 0 24px rgba(255,255,255,0.08)"}}/>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"white",letterSpacing:3,marginBottom:8}}>VIVENTRA</div>
              <div style={{fontSize:11,letterSpacing:3,marginBottom:24,textTransform:"uppercase"}}>Aesthetic Living</div>
              <div style={{fontSize:13,lineHeight:1.8}}>Crafting beautiful spaces, one piece at a time.<br/>Bangladesh · viventra.shop</div>
              <div
                style={{marginTop:32,fontSize:11,color:"rgba(255,255,255,0.35)",userSelect:"none"}}
                onClick={handleFooterSecretClick}
              >© 2024 VIVENTRA. All rights reserved.</div>
            </footer>
          )}
        </>
      )}
    </>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, index, onView, onAdd, getFinalPrice, hasDiscount, getSavings }) {
  const finalPrice = getFinalPrice(product);
  const onSale = hasDiscount(product);
  const outOfStock = product.stock !== null && product.stock !== undefined && Number(product.stock) <= 0;
  return (
    <div className="product-card" style={{animationDelay:`${index*60}ms`}} onClick={onView}>
      <div className="product-img-wrap" style={{background:BG_COLORS[index%4]}}>
        <div className="product-img-inner" style={outOfStock?{opacity:0.5}:undefined}>
          {product.image?<img src={product.image} alt={product.name}/>:product.emoji}
        </div>
        {product.badge&&!outOfStock&&<div className="product-badge">{product.badge}</div>}
        {onSale&&!outOfStock&&(
          <div className="sale-badge">
            {product.discountType==="percent"?`${product.discount}% OFF`:`৳${product.discount} OFF`}
          </div>
        )}
        {outOfStock&&(
          <div className="product-badge" style={{background:"#6b6560"}}>Out of Stock</div>
        )}
      </div>
      <div className="product-info">
        <div className="product-cat">{product.category.replace("-"," ")}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-desc-short">{product.desc.slice(0,80)}…</div>
        {product.freeDelivery&&!outOfStock&&(
          <div style={{fontSize:11,fontWeight:600,color:"var(--sage-dark)",marginBottom:4}}>🚚 Free Delivery</div>
        )}
        <div className="product-footer">
          <div className="price-block">
            {onSale&&<div className="price-original">৳{product.price.toLocaleString()}</div>}
            <div className={`price-final ${onSale?"":"no-discount"}`}>
              ৳{finalPrice.toLocaleString()} <span style={{fontSize:11,fontWeight:400,color:"var(--muted)"}}>BDT</span>
            </div>
          </div>
          {outOfStock
            ? <button className="add-btn" disabled style={{opacity:0.4,cursor:"not-allowed"}} onClick={e=>e.stopPropagation()}>✕</button>
            : <button className="add-btn" onClick={e=>{e.stopPropagation();onAdd();}}>+</button>}
        </div>
      </div>
    </div>
  );
}
