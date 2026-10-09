const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const BOT = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely|redditbot|applebot/i;

function esc(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function row(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reticules?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : null;
}

function card(host, proto, item) {
  const url = item ? `${proto}://${host}/reticule/${encodeURIComponent(item.id)}` : `${proto}://${host}/reticule`;
  const title = item ? `reticule for ${item.recipient}` : 'reticule — rankvault';
  const desc = item ? (item.phrase || item.file_name || 'a local file filed in the share table') : 'a drawstring handoff. not a vault drawer.';
  const image = item && String(item.mime || '').startsWith('image/') ? item.file_url : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="theme-color" content="${esc(item?.accent || '#0A84FF')}" />
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`;
}

export default async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = String(req.headers['user-agent'] || '');
  if (req.query.card || BOT.test(ua)) {
    const item = id ? await row(id) : null;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(card(host, proto, item));
    return;
  }
  if (id) {
    const item = await row(id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(item ? 200 : 404).json(item || { error: 'missing' });
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true, desk: 'reticule' });
}
