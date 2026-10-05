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

function prettySize(n) {
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

function card({ title, desc, url, image, color }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="${esc(c)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(img)}" /><meta property="og:image:secure_url" content="${esc(img)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(img)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;padding:64px 28px"><p style="letter-spacing:.08em;text-transform:uppercase;opacity:.55;font-size:13px">rankvault</p><h1 style="letter-spacing:-.04em;font-size:32px">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  const page = (req.query.page || '').toString().toLowerCase();
  const id = (req.query.id || '').toString();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const dest = `${proto}://${host}/${page}${id ? '/' + encodeURIComponent(id) : ''}`;
  let title = page === 'lashing' ? 'lashing — rankvault' : 'wharf — rankvault';
  let desc = page === 'lashing'
    ? 'A local file lashed to a share that already landed. Not a vault drawer. Large files are warned, never refused.'
    : 'A local file set on the wharf with a tide note. Bytes land in the share table. Large files are warned, never refused.';
  let image;
  let color = page === 'lashing' ? '#FF9F0A' : '#64D2FF';
  if (id) {
    const share = await sbGet(`public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,caption,meta&limit=1`);
    const desk = page === 'lashing'
      ? await sbGet(`lashings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)
      : await sbGet(`wharves?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (page === 'lashing' && desk) {
      title = `${desk.knot || desk.file_name || 'lashing'} — lashing`;
      desc = `${desk.note || 'lashed to an existing share'} · ${prettySize(desk.size || share?.size)}`;
    } else if (desk) {
      title = `${desk.berth || desk.file_name || 'wharf'} — wharf`;
      desc = `${desk.collector ? 'for ' + desk.collector + ' · ' : ''}${desk.tide || desk.note || 'a tide note'} · ${prettySize(desk.size || share?.size)}`;
    } else if (share) {
      title = `${share.name} — ${page || 'share'}`;
      desc = `${share.caption || 'filed in the share table'} · ${prettySize(share.size)}`;
    }
    if (share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '')) image = share.file_url;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(card({ title, desc, url: dest, image, color }));
}
