const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

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

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|discordbot/i.test(ua || '');
}

function cardHtml({ title, desc, url, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"/><meta name="theme-color" content="#0A84FF"/><meta property="og:type" content="website"/><meta property="og:site_name" content="rankvault"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(desc)}"/><meta property="og:image" content="${esc(img)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:url" content="${esc(url)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(desc)}"/><meta name="twitter:image" content="${esc(img)}"/></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.08em;text-transform:uppercase;font-size:13px">rankvault</p><h1 style="font-weight:600;letter-spacing:-0.03em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

async function sbGet(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/outbox_drops?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const page = (req.query.page || '').toString();
  const id = (req.query.id || '').toString().trim();
  try {
    if (page === 'outbox' || page === 'postbag' || (req.method === 'GET' && id && isBot(req.headers['user-agent']))) {
      const row = id ? await sbGet(id) : null;
      const dest = id ? `${proto}://${host}/outbox/${encodeURIComponent(id)}` : `${proto}://${host}/outbox`;
      const image = row && String(row.mime || '').startsWith('image/') && /^https?:/i.test(row.file_url || '') ? row.file_url : undefined;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      res.status(200).send(cardHtml({
        title: row ? `${row.name} — outbox` : 'outbox — rankvault',
        desc: row
          ? `${row.note || 'a file sent from this desk'} · ${prettySize(row.size)}${row.sent_to ? ' · for ' + row.sent_to : ''}`
          : 'Send a local file into the outbox table. Large files are warned, never refused. Discord cards on every link.',
        url: dest,
        image,
      }));
      return;
    }
    if (req.method === 'GET') {
      if (id) {
        const row = await sbGet(id);
        if (!row) {
          res.status(404).json({ error: 'not found' });
          return;
        }
        res.status(200).json({ drop: row });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/outbox_drops?select=id,name,mime,size,file_url,note,sent_to,author,created_at&order=created_at.desc&limit=40`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ drops: Array.isArray(rows) ? rows : [] });
      return;
    }
    res.status(405).json({ error: 'method' });
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : 'outbox failed' });
  }
}
