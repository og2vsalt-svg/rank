const SB = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function readRow(id) {
  if (!id) return null;
  const res = await fetch(`${SB}/rest/v1/stringcourses?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : null;
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const id = (req.query && (req.query.id || '')) || '';
  const page = (req.query && req.query.page) || 'stringcourse';
  const row = await readRow(id);
  const title = row ? row.line.slice(0, 80) : page === 'beltcourse' ? 'beltcourse' : 'stringcourse';
  const desc = row
    ? `${row.tone || 'plain'} · ${row.file_name || 'file'} · ${row.author || 'unsigned'}. A local file on the wall. No size cap.`
    : 'A wall band for one local file and one line. Large drops are warned, never refused.';
  const url = `${proto}://${host}/${page}${id ? '/' + encodeURIComponent(id) : ''}`;
  const image = row && row.mime && String(row.mime).startsWith('image/') && row.file_url ? row.file_url : `${proto}://${host}/og.png`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:site_name" content="rankvault">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
</head><body><p><a href="${esc(url)}">${esc(title)}</a></p></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).send(html);
}
