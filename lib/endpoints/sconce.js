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

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|embedly|discordbot|slack-imgproxy/i.test(ua || '');
}

function cardHtml({ title, desc, url }) {
  const img = 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#FFD60A"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${img}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:64px 28px"><p style="letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:#8e8e93">sconce</p><h1 style="letter-spacing:-.04em;font-size:32px">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
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

  try {
    if (req.method === 'GET' && (isBot(ua) || req.query.embed === '1')) {
      let row = null;
      if (id) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/sconce_lines?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
        const rows = r.ok ? await r.json() : [];
        row = Array.isArray(rows) ? rows[0] : null;
      }
      const dest = `${proto}://${host}/sconce${id ? '/' + encodeURIComponent(id) : ''}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(cardHtml({
        title: row ? `${row.title} — sconce` : 'sconce — rankvault',
        desc: row ? String(row.body || '').slice(0, 180) : 'A reading lamp for short lines. Not a file cabinet.',
        url: dest,
      }));
      return;
    }
    if (req.method === 'GET') {
      const filter = id ? `id=eq.${encodeURIComponent(id)}&` : '';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/sconce_lines?${filter}select=id,title,body,author,created_at&order=created_at.desc&limit=24`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ ok: true, lines: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const title = String(body.title || '').trim().slice(0, 120);
      const text = String(body.body || '').trim().slice(0, 4000);
      if (!title || !text) {
        res.status(400).json({ error: 'title and body are required' });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/sconce_lines`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ title, body: text, author: String(body.author || '').trim().slice(0, 40) || null }),
      });
      if (!r.ok) {
        res.status(502).json({ error: (await r.text()).slice(0, 220) || 'sconce table refused the line' });
        return;
      }
      const saved = await r.json();
      res.status(200).json({ ok: true, line: Array.isArray(saved) ? saved[0] : saved });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'sconce failed' });
  }
}
