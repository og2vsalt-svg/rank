const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  const amp = String.fromCharCode(38) + 'amp;';
  const lt = String.fromCharCode(38) + 'lt;';
  const gt = String.fromCharCode(38) + 'gt;';
  const quot = String.fromCharCode(38) + 'quot;';
  return String(s || '').replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot);
}

async function sbGet(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

function card({ title, desc, url, color, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="${esc(c)}"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}"></head><body></body></html>`;
}

export default async function handler(req, res) {
  const page = (req.query.page || '').toString().toLowerCase();
  const id = (req.query.id || '').toString();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const dest = `${proto}://${host}/${page}${id ? '/' + encodeURIComponent(id) : ''}`;
  let title = `${page || 'rankvault'} \u2014 rankvault`;
  let desc = 'quiet file hosting. large files are warned, never refused.';
  let color = '#0A84FF';
  let image;
  if (page === 'blotter') {
    title = 'blotter \u2014 a margin, not a drawer';
    desc = 'a note beside a share that already landed.';
    color = '#FFD60A';
    if (id) {
      const row = await sbGet(`blotter_marks?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
      if (row) { title = `margin on ${row.share_id}`; desc = row.margin; }
    }
  } else if (page === 'billboard') {
    title = 'billboard \u2014 a wall, not a drawer';
    desc = 'a headline. a local file lands in the share table only if you bring one.';
    if (id) {
      const row = await sbGet(`billboard_posts?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
      if (row) {
        title = row.headline;
        desc = row.line || 'a poster on the wall';
        color = row.accent || color;
        if (row.share_id) {
          const share = await sbGet(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=file_url,mime&limit=1`);
          if (share && String(share.mime || '').startsWith('image/')) image = share.file_url;
        }
      }
    }
  } else if (page === 'companion') {
    title = 'companion \u2014 a pair, not a drawer';
    desc = 'two local files in the share table, and the sentence between them.';
    color = '#64D2FF';
    if (id) {
      const row = await sbGet(`companion_pairs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
      if (row) {
        title = row.relation;
        desc = `${row.left_id} and ${row.right_id}`;
        const share = await sbGet(`public_shares?id=eq.${encodeURIComponent(row.left_id)}&select=file_url,mime&limit=1`);
        if (share && String(share.mime || '').startsWith('image/')) image = share.file_url;
      }
    }
  }
  const html = card({ title, desc, url: dest, color, image });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).send(html);
}
