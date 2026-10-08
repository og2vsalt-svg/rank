const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|embedly|iframely|applebot|pinterest|bot|crawler|spider/i.test(ua || '');
}

function pretty(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
}

async function one(table, id) {
  if (!id) return null;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : null;
}

function html(card) {
  const image = card.image && /^https?:\/\//i.test(card.image) ? card.image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${esc(card.title)}</title><meta name="description" content="${esc(card.desc)}"/><meta name="theme-color" content="#0A84FF"/><meta property="og:type" content="website"/><meta property="og:site_name" content="rankvault"/><meta property="og:title" content="${esc(card.title)}"/><meta property="og:description" content="${esc(card.desc)}"/><meta property="og:image" content="${esc(image)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:url" content="${esc(card.url)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(card.title)}"/><meta name="twitter:description" content="${esc(card.desc)}"/><meta name="twitter:image" content="${esc(image)}"/></head><body style="margin:0;background:#070709;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:56px 24px"><p style="letter-spacing:.14em;text-transform:uppercase;font-size:12px;opacity:.5">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(card.title)}</h1><p style="color:#a1a1aa;max-width:40rem">${esc(card.desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  const page = String((req.query && req.query.page) || 'plinth').toLowerCase();
  const id = String((req.query && req.query.id) || '').trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const dest = `${proto}://${host}/${page}${id ? '/' + encodeURIComponent(id) : ''}`;
  const ua = req.headers['user-agent'];
  let title = page === 'inlet' ? 'inlet — a line you kept' : 'plinth — a file on the wall';
  let desc = page === 'inlet'
    ? 'A reading note. Not a file cabinet. Discord unfurls /inlet.'
    : 'A wall label for a local file. No size cap, only a warning if the drop may be slow. Discord unfurls /plinth.';
  let image;
  if (id && page === 'plinth') {
    const row = await one('plinths', id);
    if (row) {
      title = `${row.title} — plinth`;
      desc = [row.label, row.materials, row.year_note, row.file_name ? pretty(row.size) : null].filter(Boolean).join(' · ') || 'a label on rankvault';
      if (row.mime && String(row.mime).startsWith('image/') && /^https?:\/\//i.test(row.file_url || '')) image = row.file_url;
    }
  }
  if (id && page === 'inlet') {
    const row = await one('inlets', id);
    if (row) {
      title = `${row.title} — inlet`;
      desc = row.excerpt || row.source_url || 'a line kept on rankvault';
    }
  }
  if (!isBot(ua) && String(req.query.card || '') !== '1') {
    res.statusCode = 302;
    res.setHeader('Location', dest);
    res.end();
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.end(html({ title, desc, url: dest, image }));
}
