function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  const amp = String.fromCharCode(38);
  return String(s || '')
    .replace(/&/g, amp + 'amp;')
    .replace(/</g, amp + 'lt;')
    .replace(/>/g, amp + 'gt;')
    .replace(/"/g, amp + 'quot;');
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider|redditbot|applebot|discordbot|iframely|unfurl|pinterest|notion|teams|slack-imgproxy/i.test(ua || '');
}

async function sbGet(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

function pageHtml({ title, desc, url }) {
  const image = 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#64D2FF" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(image)}" /><meta property="og:image:secure_url" content="${esc(image)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(image)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || 'cask').toString().trim().toLowerCase();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const origin = `${proto}://${host}`;
  const ua = req.headers['user-agent'] || '';
  const embedFlag = (req.query.embed || '').toString();
  const dest = id ? `${origin}/${page}/${encodeURIComponent(id)}` : `${origin}/${page}`;

  let title = page === 'stave' ? 'stave' : 'cask';
  let desc = page === 'stave'
    ? 'A public index of cask bundles. Each file still lives in the share table. Large drops are warned, never refused.'
    : 'A bundle of local files. Bytes land in the share table, then the cask row keeps the list. Large drops are warned, never refused.';

  if (id && page !== 'stave') {
    const row = await sbGet(`casks?id=eq.${encodeURIComponent(id)}&select=title,note,author,file_ids&limit=1`);
    if (row) {
      const count = Array.isArray(row.file_ids) ? row.file_ids.length : 0;
      title = `cask · ${row.title || 'untitled'}`;
      desc = `${count} file${count === 1 ? '' : 's'}${row.author ? ` · ${row.author}` : ''}. ${row.note || 'a bundle from this desk.'}`;
    } else {
      title = 'cask';
      desc = 'that cask is missing.';
    }
  }

  if (!isBot(ua) && embedFlag !== '1') {
    res.status(302).setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(pageHtml({ title, desc, url: dest }));
}
