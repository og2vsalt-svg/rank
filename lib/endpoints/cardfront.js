const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  const amp = '&' + 'amp;';
  const lt = '&' + 'lt;';
  const gt = '&' + 'gt;';
  const quot = '&' + 'quot;';
  return String(s || '').split('&').join(amp).split('<').join(lt).split('>').join(gt).split('"').join(quot);
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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch { return null; }
}
function html({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '" /><meta name="theme-color" content="' + esc(c) + '" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="' + esc(title) + '" /><meta property="og:description" content="' + esc(desc) + '" /><meta property="og:image" content="' + esc(safeImg) + '" /><meta property="og:image:secure_url" content="' + esc(safeImg) + '" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:type" content="image/png" /><meta property="og:image:alt" content="rankvault" /><meta property="og:url" content="' + esc(url) + '" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="' + esc(title) + '" /><meta name="twitter:description" content="' + esc(desc) + '" /><meta name="twitter:image" content="' + esc(safeImg) + '" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;letter-spacing:.12em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em;font-size:34px">' + esc(title) + '</h1><p style="color:#a1a1aa;max-width:42rem">' + esc(desc) + '</p></body></html>';
}

const BLURBS = {
  home: 'private file hosting. discord cards on every link, including this one.',
  wicket: 'a local file passed through the wicket. bytes land in storage, the row lives in wickets. large drops are warned, never refused.',
  letterpress: 'a set card, not a cabinet. /letterpress/id unfurls the title and the line.',
  knocker: 'a calling note and a local file left at the door. large drops are warned, never refused.',
  commonplace: 'a kept line, not a file. /commonplace/id unfurls the sentence.',
  vault: 'local-first files. public drops go to the share table. large files are warned, never refused.',
  handover: 'a local file passed to the next person on a chain. discord cards on /handover/id.',
  seal: 'a local file plus its sha-256. large drops are warned, never refused.',
};

const SHARE_PAGES = new Set(['s', 'share', 'f', 'open', 'go', 'link', 'card']);

export default async function handler(req, res) {
  const page = (req.query.page || 'home').toString().toLowerCase();
  const id = (req.query.id || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app').toString();
  const dest = proto + '://' + host + (page === 'home' ? '/' : '/' + page + (id ? '/' + encodeURIComponent(id) : ''));
  let title = page === 'home' ? 'rankvault — private file hosting' : page + ' — rankvault';
  let desc = BLURBS[page] || 'a desk on rankvault. large files are warned, never refused. discord cards on every link.';
  let image;
  let color = '#0A84FF';

  if (page === 'letterpress' && id) {
    const row = await sbGet('letterpress?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.title || 'letterpress') + ' — letterpress';
      desc = String(row.body || '').slice(0, 180) + (row.author ? ' · ' + row.author : '');
      color = row.accent || color;
    }
  } else if (page === 'wicket' && id) {
    const row = await sbGet('wickets?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.file_name || 'file') + ' — wicket';
      desc = (row.caller ? row.caller + ' passed a file' : 'a file through the wicket') + (row.note ? ' · ' + String(row.note).slice(0, 160) : '') + ' · ' + prettySize(row.size);
      color = row.accent || color;
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (page === 'knocker' && id) {
    const row = await sbGet('knockers?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.file_name || 'knock') + ' — knocker';
      desc = (row.caller ? row.caller + ' left a file' : 'a file at the door') + (row.note ? ' · ' + String(row.note).slice(0, 160) : '') + ' · ' + prettySize(row.size);
      color = row.accent || color;
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (page === 'commonplace' && id) {
    const row = await sbGet('commonplace?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = 'commonplace — rankvault';
      desc = String(row.line || '').slice(0, 180) + (row.author ? ' · ' + row.author : '');
      color = '#FFD60A';
    }
  } else if (id && SHARE_PAGES.has(page)) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.meta && row.meta.cardTitle) || row.name || 'share';
      desc = row.caption || prettySize(row.size) + ' · public drop on rankvault';
      if (/^image\//.test(row.mime || '')) image = row.file_url;
      color = (row.meta && row.meta.color) || color;
    }
  } else if (id) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.meta && row.meta.cardTitle) || row.name || page;
      desc = (row.caption || prettySize(row.size) + ' filed on rankvault') + (row.author ? ' · ' + row.author : '');
      color = (row.meta && (row.meta.color || row.meta.accent)) || color;
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html({ title, desc, image, url: dest, color }));
}
