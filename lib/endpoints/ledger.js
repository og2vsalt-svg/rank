const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(value) {
  return String(value || '')
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;');
}

function pageHtml({ title, desc, url, image }) {
  return '<!doctype html><html><head><meta charset="utf-8" /><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="' + esc(title) + '" /><meta property="og:description" content="' + esc(desc) + '" /><meta property="og:image" content="' + esc(image) + '" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="' + esc(url) + '" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="' + esc(title) + '" /><meta name="twitter:description" content="' + esc(desc) + '" /><meta name="twitter:image" content="' + esc(image) + '" /><meta name="theme-color" content="#30D158" /></head><body style="margin:0;background:#070708;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;font-size:12px;letter-spacing:.14em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">' + esc(title) + '</h1><p style="color:#a1a1aa">' + esc(desc) + '</p></body></html>';
}

export default async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const origin = proto + '://' + host;
  const dest = id ? origin + '/ledger/' + encodeURIComponent(id) : origin + '/ledger';
  const image = 'https://og2vsalt-svg.github.io/rank/og.png';
  let title = id ? id + ' — ledger' : 'ledger — a running book';
  let desc = 'Lines in a shared book. No file attached. Paste the link in Discord for a card.';

  if (id) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/ledger_lines?book=eq.' + encodeURIComponent(id) + '&select=label,amount,note&order=created_at.desc&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) desc = row.label + (row.amount != null ? ' · ' + row.amount : '') + (row.note ? ' · ' + String(row.note).slice(0, 140) : '');
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.statusCode = 200;
  res.end(pageHtml({ title, desc, url: dest, image }));
}
