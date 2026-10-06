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
  return (x / 1048576).toFixed(1) + ' MB';
}

async function row(table, id, select) {
  const r = await fetch(
    SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id) + '&select=' + select + '&limit=1',
    { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } },
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return rows && rows[0] ? rows[0] : null;
}

export default async function handler(req, res) {
  const page = String((req.query && (req.query.page || req.query.name)) || 'hamper');
  const id = String((req.query && req.query.id) || '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const url = proto + '://' + host + '/' + page + (id ? '/' + encodeURIComponent(id) : '');
  let title = page === 'marginalia' ? 'Marginalia — rankvault' : 'Hamper — rankvault';
  let desc =
    page === 'marginalia'
      ? 'A note in the margin of a shared file. Paste the link in Discord for a card.'
      : 'Several local files packed into one share. Large drops are warned, never refused.';
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';

  if (id && page === 'hamper') {
    const pack = await row('hampers', id, 'title,note,author');
    if (pack) {
      const files = await fetch(
        SUPABASE_URL + '/rest/v1/hamper_files?hamper_id=eq.' + encodeURIComponent(id) + '&select=name,size,mime,file_url',
        { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } },
      );
      const list = files.ok ? await files.json() : [];
      const names = Array.isArray(list) ? list.map((f) => f.name).slice(0, 4).join(', ') : '';
      title = pack.title + ' — hamper';
      desc = (pack.note || names || 'a packed share') + (pack.author ? ' · ' + pack.author : '');
      const pic = Array.isArray(list) && list.find((f) => String(f.mime || '').indexOf('image/') === 0 && /^https?:/i.test(f.file_url || ''));
      if (pic) image = pic.file_url;
    }
  }

  if (id && page === 'marginalia') {
    const note = await row('marginalia', id, 'passage,file_name,author,share_id');
    if (note) {
      title = (note.file_name || 'margin note') + ' — marginalia';
      desc = String(note.passage || '').slice(0, 180) + (note.author ? ' · ' + note.author : '');
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
    '</p><p>' +
    esc(prettySize(0).replace('0 B', '')) +
    '</p></body></html>';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
