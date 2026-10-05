const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|embedly|discordbot/i.test(ua || '');
}

async function sb(path, init) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init && init.headers) } });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  return data;
}

function cardHtml({ title, desc, url }) {
  const img = 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"/><meta name="theme-color" content="#FFD60A"/><meta property="og:type" content="website"/><meta property="og:site_name" content="rankvault"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(desc)}"/><meta property="og:image" content="${img}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:url" content="${esc(url)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(desc)}"/><meta name="twitter:image" content="${img}"/></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;letter-spacing:.12em;text-transform:uppercase;font-size:12px">rankvault · vesper</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = req.headers['user-agent'] || '';
  const id = (req.query.id || '').toString().trim();

  try {
    if (req.method === 'GET' && (req.query.card === '1' || isBot(ua))) {
      const dest = `${proto}://${host}/vesper${id ? '/' + encodeURIComponent(id) : ''}`;
      let title = 'vesper — a watch, not a drawer';
      let desc = 'Ring a time and a line. Not a file cabinet. Discord unfurls /vesper.';
      if (id) {
        const rows = await sb(`vesper_bells?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
        const bell = Array.isArray(rows) ? rows[0] : null;
        if (bell) {
          title = `${bell.title} — vesper`;
          desc = `${bell.when_note || 'a watch'} · ${bell.body || 'a line on the board'}`;
        }
      }
      if (!isBot(ua) && req.query.card !== '1') {
        res.status(302).setHeader('Location', dest);
        return res.end();
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(200).send(cardHtml({ title, desc, url: dest }));
    }

    if (req.method === 'GET') {
      if (id) {
        const rows = await sb(`vesper_bells?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
        const bell = Array.isArray(rows) ? rows[0] : null;
        if (!bell) return res.status(404).json({ error: 'bell not found' });
        return res.status(200).json({ ok: true, bell });
      }
      const rows = await sb('vesper_bells?select=*&order=created_at.desc&limit=40');
      return res.status(200).json({ ok: true, bells: rows || [] });
    }

    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const bellId = uid();
      const row = {
        id: bellId,
        title: String(body.title || 'watch').slice(0, 140),
        when_note: body.when ? String(body.when).slice(0, 80) : null,
        body: body.body ? String(body.body).slice(0, 500) : null,
        author: body.author ? String(body.author).slice(0, 80) : null,
      };
      await sb('vesper_bells', { method: 'POST', body: JSON.stringify(row) });
      return res.status(200).json({ ok: true, id: bellId, path: `/vesper/${bellId}` });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'vesper failed' });
  }
}
