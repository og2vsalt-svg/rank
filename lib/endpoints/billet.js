function esc(s) {
  const amp = String.fromCharCode(38);
  const lt = String.fromCharCode(60);
  const gt = String.fromCharCode(62);
  const q = String.fromCharCode(34);
  return String(s || '')
    .split(amp).join(amp + 'amp;')
    .split(lt).join(amp + 'lt;')
    .split(gt).join(amp + 'gt;')
    .split(q).join(amp + 'quot;');
}

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
}

export default async function handler(req, res) {
  const page = String((req.query && (req.query.page || req.query.name)) || 'billet');
  const id = String((req.query && req.query.id) || '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const url = proto + '://' + host + '/' + page + (id ? '/' + encodeURIComponent(id) : '');
  let title = page === 'ack' ? 'Ack — rankvault' : 'Billet — rankvault';
  let desc = page === 'ack'
    ? 'Receipt board for delivery slips. Mark a file received. Not a vault drawer.'
    : 'A delivery slip for one local file. Large drops are warned, never refused.';
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';

  if (id && page === 'billet') {
    const r = await fetch(
      SUPABASE_URL + '/rest/v1/billets?id=eq.' + encodeURIComponent(id) + '&select=title,for_whom,note,author,file_name,mime,size,file_url,received_at&limit=1',
      { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } },
    );
    const rows = r.ok ? await r.json() : [];
    const slip = Array.isArray(rows) ? rows[0] : null;
    if (slip) {
      title = slip.title + ' — billet';
      desc = (slip.note || slip.file_name || 'a delivery slip')
        + (slip.for_whom ? ' · for ' + slip.for_whom : '')
        + (slip.author ? ' · from ' + slip.author : '')
        + ' · ' + prettySize(slip.size)
        + (slip.received_at ? ' · received' : '');
      if (String(slip.mime || '').indexOf('image/') === 0 && /^https?:/i.test(slip.file_url || '')) image = slip.file_url;
    }
  }

  if (page === 'ack') {
    const r = await fetch(
      SUPABASE_URL + '/rest/v1/billets?select=title,received_at&order=created_at.desc&limit=4',
      { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } },
    );
    const rows = r.ok ? await r.json() : [];
    if (Array.isArray(rows) && rows.length) {
      desc = rows.map((row) => row.title + (row.received_at ? ' (received)' : '')).join(', ');
    }
  }

  const html =
    '<!doctype html><html><head><meta charset="utf-8"><title>' +
    esc(title) +
    '</title><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="' +
    esc(title) +
    '"><meta property="og:description" content="' +
    esc(desc) +
    '"><meta property="og:image" content="' +
    esc(image) +
    '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="' +
    esc(url) +
    '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' +
    esc(title) +
    '"><meta name="twitter:description" content="' +
    esc(desc) +
    '"><meta name="twitter:image" content="' +
    esc(image) +
    '"><meta name="theme-color" content="#0A84FF"></head><body style="background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:48px"><h1>' +
    esc(title) +
    '</h1><p>' +
    esc(desc) +
    '</p></body></html>';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
