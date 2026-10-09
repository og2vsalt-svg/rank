const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const id = String((req.query && req.query.id) || '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const pageUrl = proto + '://' + host + '/ferule' + (id ? '/' + encodeURIComponent(id) : '');
  let title = 'ferule — rankvault';
  let desc = 'A pointer and a question. The local file lands in the share table. Answers can follow without a second cabinet.';
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';
  if (id) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/public_shares?id=eq.' + encodeURIComponent(id) + '&select=id,name,caption,author,mime,file_url,size&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = (row.name || 'ferule') + ' — ferule';
        desc = (row.caption || desc) + (row.author ? ' · ' + row.author : '');
        if (String(row.mime || '').indexOf('image/') === 0 && /^https?:/i.test(row.file_url || '')) image = row.file_url;
      }
    }
  }
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(image) + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="' + esc(pageUrl) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '"><meta name="twitter:image" content="' + esc(image) + '"><meta name="theme-color" content="#0A84FF"></head><body style="background:#f5f5f7;color:#1d1d1f;font-family:-apple-system,Inter,sans-serif;padding:48px"><h1>' + esc(title) + '</h1><p>' + esc(desc) + '</p></body></html>';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
