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

async function row(id) {
  const r = await fetch(
    SUPABASE_URL + '/rest/v1/sideboards?id=eq.' + encodeURIComponent(id) + '&select=title,note,author,file_name,mime,file_url&limit=1',
    { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } },
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return rows && rows[0] ? rows[0] : null;
}

export default async function handler(req, res) {
  const page = String((req.query && (req.query.page || req.query.name)) || 'sideboard');
  const id = String((req.query && req.query.id) || '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const url = proto + '://' + host + '/' + page + (id ? '/' + encodeURIComponent(id) : '');
  let title = page === 'linseed' ? 'Linseed — rankvault' : 'Sideboard — rankvault';
  let desc = page === 'linseed'
    ? 'A public index of files set out with replies. Not a vault. Large drops are warned, never refused.'
    : 'One local file on a shared table, with replies underneath. Not a vault.';
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';

  if (id && page === 'sideboard') {
    const board = await row(id);
    if (board) {
      title = board.title + ' — sideboard';
      desc = (board.note || board.file_name || 'a file on the table') + (board.author ? ' · ' + board.author : '');
      if (String(board.mime || '').indexOf('image/') === 0 && /^https?:/i.test(board.file_url || '')) image = board.file_url;
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
