const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const BOT = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely|redditbot|applebot/i;

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prettySize(size) {
  const n = Number(size) || 0;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function pageHtml({ title, desc, url, image }) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="' + esc(title) + '" /><meta property="og:description" content="' + esc(desc) + '" /><meta property="og:url" content="' + esc(url) + '" /><meta property="og:image" content="' + esc(image) + '" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="' + esc(title) + '" /><meta name="twitter:description" content="' + esc(desc) + '" /><meta name="twitter:image" content="' + esc(image) + '" /><meta name="theme-color" content="#0A84FF" /></head><body style="margin:0;background:#070708;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;font-size:12px;letter-spacing:.14em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">' + esc(title) + '</h1><p style="color:#a1a1aa">' + esc(desc) + '</p></body></html>';
}

export default async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').trim();
  const page = String((req.query && req.query.page) || 'splice').toLowerCase();
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const origin = proto + '://' + host;
  const dest = id ? origin + '/' + page + '/' + encodeURIComponent(id) : origin + '/' + page;
  const image = 'https://og2vsalt-svg.github.io/rank/og.png';
  let title = page === 'serving' ? 'serving — filed splices' : 'splice — pair two files';
  let desc = page === 'serving'
    ? 'Pairs already filed in the share table. Open one to compare names, sizes, and hashes. Large drops are warned, never refused.'
    : 'Two local files, one card. Both land in the share table. No size cap, only a slowness note.';

  if (id && page !== 'serving') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/splices?id=eq.' + encodeURIComponent(id) + '&select=title,note,left_name,right_name,left_size,right_size&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = (row.title || 'splice') + ' — splice';
        desc = (row.left_name || 'left') + ' (' + prettySize(row.left_size) + ') beside ' + (row.right_name || 'right') + ' (' + prettySize(row.right_size) + '). ' + (row.note || 'paired files');
      }
    }
  }

  const ua = String(req.headers['user-agent'] || '');
  if (!BOT.test(ua) && String(req.query.embed || '') !== '1') {
    res.statusCode = 302;
    res.setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.statusCode = 200;
  res.end(pageHtml({ title, desc, url: dest, image }));
}
