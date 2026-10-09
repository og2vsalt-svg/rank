function esc(s) {
  const amp = String.fromCharCode(38);
  return String(s || '')
    .split(amp).join(amp + 'amp;')
    .split('<').join(amp + 'lt;')
    .split('>').join(amp + 'gt;')
    .split('"').join(amp + 'quot;');
}

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const FALLBACK = 'https://og2vsalt-svg.github.io/rank/og.png';

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
}

async function row(table, id) {
  if (!id) return null;
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1', {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows && rows[0] ? rows[0] : null;
}

export default async function handler(req, res) {
  const page = String(req.query.page || 'home');
  const id = String(req.query.id || '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const url = proto + '://' + host + '/' + page + (id ? '/' + encodeURIComponent(id) : '');
  let title = page === 'impost' ? 'impost — rankvault' : page === 'reading' ? 'reading — rankvault' : 'rankvault';
  let desc = page === 'impost'
    ? 'A seat for one local file and a short note. Large drops are warned, never refused.'
    : page === 'reading'
      ? 'A quiet reading slip. Not a file cabinet.'
      : 'Private file hosting. Discord cards on every link.';
  let image = FALLBACK;

  if (page === 'impost' && id) {
    const seat = await row('impost_seats', id);
    if (seat) {
      title = seat.title + ' — impost';
      desc = (seat.note || seat.file_name || 'a seated file') + ' · ' + prettySize(seat.size) + (seat.author ? ' · ' + seat.author : '');
      if (String(seat.mime || '').indexOf('image/') === 0 && /^https?:/i.test(seat.file_url || '')) image = seat.file_url;
    }
  }
  if (page === 'reading' && id) {
    const slip = await row('whispers', id);
    if (slip) {
      title = (slip.author || 'reading') + ' — reading';
      desc = String(slip.body || '').slice(0, 180);
    }
  }
  if ((page === 's' || page === 'share') && id) {
    const share = await row('public_shares', id);
    if (share) {
      title = share.name;
      desc = (share.caption || 'shared file') + ' · ' + prettySize(share.size);
      if (String(share.mime || '').indexOf('image/') === 0 && /^https?:/i.test(share.file_url || '')) image = share.file_url;
    }
  }

  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><meta name="theme-color" content="#0A84FF"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(image) + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="' + esc(url) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '"><meta name="twitter:image" content="' + esc(image) + '"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:56px 24px"><p style="opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em">' + esc(title) + '</h1><p style="color:#a1a1aa">' + esc(desc) + '</p></body></html>';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
