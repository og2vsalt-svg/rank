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

export default async function spunyarn(req, res) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const page = String(req.query.page || 'spunyarn');
  const id = req.query.id ? String(req.query.id) : '';
  let title = page === 'thimble' ? 'thimble — rankvault' : 'spunyarn — rankvault';
  let desc = page === 'thimble'
    ? 'a ring of spun yarns. each yarn is a local file already in the share table. not a vault drawer.'
    : 'a short yarn tied to a local file. bytes land in the share table. large drops are warned, never refused.';
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';
  let color = page === 'thimble' ? '#FF9F0A' : '#64D2FF';
  const dest = id ? `${proto}://${host}/${page}/${encodeURIComponent(id)}` : `${proto}://${host}/${page}`;

  if (page === 'spunyarn' && id) {
    const row = await sbGet(`spunyarns?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (row) {
      title = `${row.file_name || 'file'} — spunyarn`;
      desc = row.note || desc;
      color = row.accent || color;
      if (row.share_id) {
        const share = await sbGet(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=mime,file_url&limit=1`);
        if (share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '')) image = share.file_url;
      }
    }
  }
  if (page === 'thimble' && id) {
    const row = await sbGet(`thimbles?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (row) {
      title = `${row.title || 'thimble'} — rankvault`;
      const count = Array.isArray(row.yarn_ids) ? row.yarn_ids.length : 0;
      desc = row.note || `${count} yarn${count === 1 ? '' : 's'} on this ring.`;
      color = row.accent || color;
    }
  }

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta name="theme-color" content="${esc(color)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="rankvault" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${esc(dest)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(image)}" />
<link rel="canonical" href="${esc(dest)}" />
<meta http-equiv="refresh" content="0;url=${esc(dest)}" />
</head><body><p><a href="${esc(dest)}">open</a></p></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).send(html);
}
