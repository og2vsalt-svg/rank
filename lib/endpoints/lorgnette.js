const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const BOT = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely|redditbot|applebot/i;

function esc(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function row(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/lorgnettes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : null;
}

function card(host, proto, item, page) {
  const path = page === 'monocle' ? 'monocle' : 'lorgnette';
  const url = item && path === 'lorgnette' ? `${proto}://${host}/lorgnette/${encodeURIComponent(item.id)}` : `${proto}://${host}/${path}`;
  const title = item ? item.title || item.file_name || 'lorgnette' : page === 'monocle' ? 'monocle — rankvault' : 'lorgnette — rankvault';
  const marks = Array.isArray(item?.notices) ? item.notices.filter(Boolean).slice(0, 3).join(' · ') : '';
  const desc = item ? (item.looking_for || marks || item.file_name || 'a local file filed under a viewing glass') : 'a viewing glass, not a vault drawer.';
  const image = item && String(item.mime || '').startsWith('image/') ? item.file_url : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta property="og:site_name" content="rankvault" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${esc(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta name="theme-color" content="${esc(item?.accent || '#0A84FF')}" />
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`;
}

export default async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').trim();
  const page = String((req.query && req.query.page) || 'lorgnette').toLowerCase();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = String(req.headers['user-agent'] || '');
  if (req.query.card || BOT.test(ua) || page === 'monocle') {
    const item = id && page !== 'monocle' ? await row(id) : null;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).send(card(host, proto, item, page));
    return;
  }
  if (id) {
    const item = await row(id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(item ? 200 : 404).json(item || { error: 'missing' });
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true, desk: 'lorgnette' });
}
