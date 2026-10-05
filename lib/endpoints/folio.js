const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}
function pretty(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
async function sbGet(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}
function card({ title, desc, image, url, color }) {
  const img = image && /^https?:\/\//i.test(image) && !String(image).startsWith('data:')
    ? image
    : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta name="theme-color" content="${esc(color || '#0A84FF')}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="rankvault" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(img)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(img)}" />
</head><body><p><a href="${esc(url)}">${esc(title)}</a></p></body></html>`;
}

export function makeHandler({ page, fallbackTitle, fallbackDesc, table, color }) {
  return async function handler(req, res) {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const id = (req.query && req.query.id) || '';
    const dest = `${proto}://${host}/${page}${id ? '/' + encodeURIComponent(id) : ''}`;
    let title = fallbackTitle;
    let desc = fallbackDesc;
    let image = '';
    if (id) {
      const row = await sbGet(`${table}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
      if (row) {
        title = row.title || title;
        const extra = table === 'slates'
          ? (Array.isArray(row.lines) ? row.lines.map((l) => l.text).filter(Boolean).join(' · ') : '')
          : row.margin;
        desc = [extra, row.file_name, pretty(row.size), row.author].filter(Boolean).join(' · ').slice(0, 280) || desc;
        if (row.share_id) {
          const share = await sbGet(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=file_url,mime&limit=1`);
          if (share && String(share.mime || '').startsWith('image/')) image = share.file_url;
        }
      }
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).send(card({ title, desc, image, url: dest, color }));
  };
}

export default makeHandler({
  page: 'folio',
  fallbackTitle: 'folio — rankvault',
  fallbackDesc: 'a local file with a margin note. large drops are warned, never refused.',
  table: 'folios',
  color: '#c4a574',
});
