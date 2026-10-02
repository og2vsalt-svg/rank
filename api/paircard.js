const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  return (x / (1024 * 1024)).toFixed(1) + ' MB';
}

async function one(table, id, select) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=${select}&limit=1`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

function html({ title, desc, url, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#0A84FF" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(img)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(img)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.08em;text-transform:uppercase;font-size:13px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p><script>if(!/discord|bot|embed|preview/i.test(navigator.userAgent||'')) location.replace(${JSON.stringify(url)});</script></body></html>`;
}

export default async function handler(req, res) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const breastwork = (req.query.breastwork || '').toString().trim();
  const scantling = (req.query.scantling || '').toString().trim();
  const page = (req.query.page || '').toString().trim().toLowerCase();
  let title = 'rankvault';
  let desc = 'quiet file hosting. discord cards on every link.';
  let dest = `${proto}://${host}/`;
  let image;
  if (breastwork) {
    const row = await one('breastworks', breastwork, 'id,title,note,left_name,right_name,accent');
    dest = `${proto}://${host}/#breastwork?f=${encodeURIComponent(breastwork)}`;
    title = row ? `${row.title} — rankvault` : 'breastwork — rankvault';
    const sides = row ? [row.left_name, row.right_name].filter(Boolean).join(' · ') : '';
    desc = row ? `${row.note ? row.note + ' · ' : ''}${sides || 'a filed pair'}` : 'two local files, filed side by side.';
  } else if (scantling) {
    const row = await one('scantlings', scantling, 'id,label,note,share_id,width,height,bytes');
    dest = `${proto}://${host}/#scantling?f=${encodeURIComponent(scantling)}`;
    title = row ? `${row.label} — rankvault` : 'scantling — rankvault';
    desc = row
      ? `${row.note ? row.note + ' · ' : ''}${row.bytes ? prettySize(row.bytes) : 'filed'}${row.width && row.height ? ' · ' + row.width + '×' + row.height : ''}`
      : 'a measure filed with the local file.';
    if (row && row.share_id) {
      const share = await one('public_shares', row.share_id, 'mime,file_url');
      if (share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '')) image = share.file_url;
    }
  } else if (page) {
    dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    title = `${page} — rankvault`;
    desc = page === 'breastwork'
      ? 'two local files filed side by side. discord unfurls the pair.'
      : 'read a local file, then file the measure. discord unfurls the card.';
  }
  const ua = String(req.headers['user-agent'] || '');
  if (!/discord|bot|embed|preview|slack|twitter|facebook/i.test(ua) && req.query.embed !== '1') {
    res.status(302).setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html({ title, desc, url: dest, image }));
}
