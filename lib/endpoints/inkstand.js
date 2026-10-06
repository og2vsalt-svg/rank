const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (ch) => ({
    '&': '&' + 'amp;',
    '<': '&' + 'lt;',
    '>': '&' + 'gt;',
    '"': '&' + 'quot;',
  }[ch]));
}

async function loadScrap(id) {
  const url = `${SUPABASE_URL}/rest/v1/inkstand_scraps?id=eq.${encodeURIComponent(id)}&select=id,title,body,author,accent,created_at&limit=1`;
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : null;
}

async function loadShare(id) {
  const url = `${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,caption,author&limit=1`;
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : null;
}

function page({ title, description, url, site }) {
  const t = esc(title);
  const d = esc(description);
  const u = esc(url);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>${t}</title>
<meta name="description" content="${d}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="rankvault"/>
<meta property="og:title" content="${t}"/>
<meta property="og:description" content="${d}"/>
<meta property="og:url" content="${u}"/>
<meta property="og:image" content="https://og2vsalt-svg.github.io/rank/og.png"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${t}"/>
<meta name="twitter:description" content="${d}"/>
<meta name="twitter:image" content="https://og2vsalt-svg.github.io/rank/og.png"/>
<meta name="theme-color" content="#0A84FF"/>
</head><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#050506;color:#f5f5f7;padding:48px">
<p style="color:#0A84FF">${esc(site)}</p>
<h1>${t}</h1>
<p>${d}</p>
<p><a href="${u}" style="color:#fff">${u}</a></p>
</body></html>`;
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  const pageName = String(req.query.page || 'inkstand');
  const id = String(req.query.id || '');
  let title = 'rankvault — inkstand';
  let description = 'A shared writing desk. Scraps live in the database, not a file drawer. Discord cards on every link.';
  let url = `${origin}/${pageName}`;
  if (pageName === 'waypost') {
    title = 'rankvault — waypost';
    description = 'Drop a local file. It is stored and indexed. Large drops are warned, never refused.';
  }
  if (id && pageName === 'inkstand') {
    const row = await loadScrap(id).catch(() => null);
    url = `${origin}/inkstand/${id}`;
    if (row) {
      title = row.title || 'inkstand scrap';
      const who = row.author ? ` · ${row.author}` : '';
      description = `${String(row.body || '').slice(0, 180)}${who}`.replace(/\s+/g, ' ');
    } else {
      title = 'inkstand scrap';
      description = 'This scrap is on rankvault. Open the link to read it.';
    }
  }
  if (id && pageName === 'waypost') {
    const row = await loadShare(id).catch(() => null);
    url = `${origin}/waypost/${id}`;
    if (row) {
      title = row.name || 'waypost file';
      const kb = row.size ? `${Math.max(1, Math.round(Number(row.size) / 1024))} KB` : 'file';
      description = `${row.caption || 'A shared file on rankvault.'} · ${kb}${row.author ? ' · ' + row.author : ''}`;
    } else {
      title = 'waypost file';
      description = 'A shared file on rankvault. Open the link to preview it.';
    }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).send(page({ title, description, url, site: pageName }));
}
