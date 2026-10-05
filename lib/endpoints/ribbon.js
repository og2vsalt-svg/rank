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

export default async function ribbon(req, res) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const page = String(req.query.page || 'ribbon');
  const id = req.query.id ? String(req.query.id) : '';
  let title = page === 'loom' ? 'loom — rankvault' : 'ribbon — rankvault';
  let desc = page === 'loom'
    ? 'lay two public shares side by side. a reading bench, not a cabinet.'
    : 'a colored receipt. the file sits in the share table. large files are warned, never refused.';
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';
  let color = page === 'loom' ? '#BF5AF2' : '#0A84FF';
  const dest = id ? `${proto}://${host}/${page}/${encodeURIComponent(id)}` : `${proto}://${host}/${page}`;
  if (page === 'ribbon' && id) {
    const row = await sbGet(`ribbons?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (row) {
      title = `${row.file_name || 'file'} — ribbon`;
      desc = row.note || desc;
      color = row.accent || color;
      if (row.share_id) {
        const share = await sbGet(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=mime,file_url&limit=1`);
        if (share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '')) image = share.file_url;
      }
    }
  }
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="${esc(color)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(image)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(dest)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(image)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.08em;text-transform:uppercase;font-size:13px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).send(html);
}
