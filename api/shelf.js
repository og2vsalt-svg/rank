function esc(s) {
  const amp = String.fromCharCode(38);
  const lt = String.fromCharCode(60);
  const gt = String.fromCharCode(62);
  const q = String.fromCharCode(34);
  return String(s || '')
    .split(amp).join(amp + 'amp;')
    .split(lt).join(amp + 'lt;')
    .split(gt).join(amp + 'gt;')
    .split(q).join(amp + 'quot;');
}

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const FALLBACK = 'https://og2vsalt-svg.github.io/rank/og.png';

const COPY = {
  quietmosaic: ["Quiet Mosaic — rankvault", "Drop local files. They arrange as a soft mosaic of frosted glass with spring motion and live image previews. Individual notes or a shared caption. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietcanvas: ["Quiet Canvas — rankvault", "Drop local files onto a soft painted canvas. Gentle brush strokes of light that breathe and settle in your chosen color. Spring motion on frosted glass. Shared note. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietlink: ["Quiet Link — rankvault", "Share any URL with a custom polished Discord embed. Set title, description, and optional image. Soft size warnings only. No hard limits. Every link unfurls a professional Discord card. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietpalimpsest: ["Quiet Palimpsest — rankvault", "Layer quiet notes over a local image. Drop a base photo, click to place text overlays with spring motion, then publish the composed PNG straight to storage and the public record. Soft size warnings only. No hard limits. Every link unfurls a polished Discord embed. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietsanctum: ["Quiet Sanctum — rankvault", "A still sanctuary for what you carry. Drop local files. They settle as soft floating glass orbs with gentle upward spring motion on frosted glass. Shared caption, warm accent. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  home: ['rankvault', 'Private file hosting and sharing. Upload local files to the database, share with professional Discord embeds. No size limits — only gentle slow warnings. Sleek Apple-style interface. Quiet Mosaic, Quiet Canvas, Quiet Link, Quiet Solace, Quiet Ember, and dozens of specialized desks.'],
};

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
}

async function getShare(id) {
  if (!id) return null;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-rivall.vercel.app');
  const original = String(req.headers['x-vercel-original-url'] || req.url || '/');
  const path = original.split('?')[0].replace(/^\/+/, '').toLowerCase();
  const parts = path.split('/').filter(Boolean);
  const page = parts[0] || 'home';
  const id = parts[1] || '';

  let title = 'rankvault';
  let desc = 'Private file hosting and sharing. Professional Discord embeds on every link. Soft size warnings only. Sleek Apple-style interface.';
  let image = FALLBACK;
  let color = '#0A84FF';

  if (COPY[page]) {
    title = COPY[page][0];
    desc = COPY[page][1];
  }

  if ((page === 's' || page === 'share' || page === 'open') && id) {
    const share = await getShare(id);
    if (share && share.is_public !== false) {
      title = (share.meta && share.meta.cardTitle) || share.name || 'shared file';
      desc = (share.caption || 'shared from rankvault') + ' · ' + prettySize(share.size);
      if (share.meta && share.meta.ogImage && /^https?:/i.test(share.meta.ogImage)) {
        image = share.meta.ogImage;
      } else if (String(share.mime || '').startsWith('image/') && /^https?:/i.test(share.file_url || '')) {
        image = share.file_url;
      }
      if (share.meta && share.meta.color) color = share.meta.color;
    }
  }

  const url = proto + '://' + host + '/' + (path || '');
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><meta name="theme-color" content="' + esc(color) + '"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(image) + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="' + esc(url) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '"><meta name="twitter:image" content="' + esc(image) + '"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:56px 24px"><p style="opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em">' + esc(title) + '</h1><p style="color:#a1a1aa">' + esc(desc) + '</p></body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
}
