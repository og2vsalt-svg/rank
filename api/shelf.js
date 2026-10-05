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

const COPY = {
  shelf: ['Shelf — rankvault', 'Drop a local file into the shared shelf. Large files are warned, never refused.'],
  board: ['Board — rankvault', 'Public files people left out. Paste the link in Discord for a card.'],
  receipt: ['Receipt — rankvault', 'A short handoff note that travels with the link.'],
  home: ['rankvault', 'Private file hosting. Share a file, keep the older desks, Discord cards on every link.'],
};

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  return (x / 1048576).toFixed(1) + ' MB';
}

export default async function handler(req, res) {
  const page = String(req.query.page || 'shelf');
  const id = String(req.query.id || '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const url = proto + '://' + host + '/' + page + (id ? '/' + encodeURIComponent(id) : '');
  let title = (COPY[page] || COPY.home)[0];
  let desc = (COPY[page] || COPY.home)[1];
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';

  if (id && (page === 'board' || page === 's' || page === 'shelf')) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/public_shares?id=eq.' + encodeURIComponent(id) + '&select=name,caption,size,mime,file_url&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows[0];
      if (row) {
        title = row.name;
        desc = (row.caption || 'shared file') + ' · ' + prettySize(row.size);
        if (String(row.mime || '').indexOf('image/') === 0 && /^https?:/i.test(row.file_url || '')) image = row.file_url;
      }
    }
  }

  if (id && page === 'receipt') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/receipts?id=eq.' + encodeURIComponent(id) + '&select=name,note,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows[0];
      if (row) {
        title = row.name + ' — receipt';
        desc = row.note || 'a handoff note';
      }
    }
  }

  const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><meta property="og:site_name" content="rankvault"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(image) + '"><meta property="og:url" content="' + esc(url) + '"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0A84FF"></head><body style="background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:48px"><h1>' + esc(title) + '</h1><p>' + esc(desc) + '</p></body></html>';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
