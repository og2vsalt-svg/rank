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
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|embedly|discordbot|slack-imgproxy/i.test(ua || '');
}

function cardHtml({ title, desc, url, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#0A84FF"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(img)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:64px 28px"><p style="letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:#8e8e93">fathom</p><h1 style="letter-spacing:-.04em;font-size:32px">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

async function sb(path, init) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init && init.headers) } });
  return r;
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
  const ua = req.headers['user-agent'] || '';
  const id = String((req.query && req.query.id) || '').trim();
  const wantsCard = isBot(ua) || req.query.embed === '1' || req.query.page === 'fathom';

  try {
    if (req.method === 'GET' && wantsCard && (isBot(ua) || req.query.embed === '1')) {
      let row = null;
      if (id) {
        const r = await sb(`fathom_drops?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
        const rows = r.ok ? await r.json() : [];
        row = Array.isArray(rows) ? rows[0] : null;
      }
      const dest = `${proto}://${host}/fathom${id ? '/' + encodeURIComponent(id) : ''}`;
      const image = row && /^image\//.test(row.mime || '') ? row.file_url : undefined;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      res.status(200).send(cardHtml({
        title: row ? `${row.place} — ${row.name}` : 'fathom — rankvault',
        desc: row ? `${row.note || 'a depth mark'} · ${prettySize(row.size)}` : 'Drop a local file into the fathom table. Large files are warned, never refused.',
        url: dest,
        image,
      }));
      return;
    }

    if (req.method === 'GET') {
      const filter = id ? `id=eq.${encodeURIComponent(id)}&` : '';
      const r = await sb(`fathom_drops?${filter}select=id,place,note,name,mime,size,file_url,share_id,author,excerpt,created_at&order=created_at.desc&limit=24`);
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ ok: true, drops: Array.isArray(rows) ? rows : [] });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const place = String(body.place || '').trim().slice(0, 80);
      const name = String(body.name || '').trim().slice(0, 180);
      const fileUrl = String(body.file_url || body.fileUrl || '').trim().slice(0, 4000);
      if (!place || !name || !fileUrl) {
        res.status(400).json({ error: 'place, name, and file url are required' });
        return;
      }
      const row = {
        id: String(body.id || '').trim().slice(0, 40) || Date.now().toString(36),
        place,
        note: String(body.note || '').trim().slice(0, 280) || null,
        name,
        mime: String(body.mime || 'application/octet-stream').slice(0, 120),
        size: Math.max(0, Number(body.size) || 0),
        file_url: fileUrl,
        share_id: String(body.share_id || body.shareId || '').slice(0, 40) || null,
        author: String(body.author || '').trim().slice(0, 40) || null,
        excerpt: String(body.excerpt || '').slice(0, 800) || null,
      };
      const r = await sb('fathom_drops', { method: 'POST', body: JSON.stringify(row) });
      if (!r.ok) {
        const text = await r.text();
        res.status(502).json({ error: text.slice(0, 220) || 'fathom table refused the row' });
        return;
      }
      const saved = await r.json();
      res.status(200).json({ ok: true, drop: Array.isArray(saved) ? saved[0] : saved });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'fathom failed' });
  }
}
