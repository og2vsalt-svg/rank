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
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|embedly|discordbot/i.test(ua || '');
}

function card({ title, desc, url }) {
  const img = 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#FF9F0A"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:12px">hearth</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

async function listNotes() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?select=id,name,caption,author,created_at,meta&order=created_at.desc&limit=40`, { headers: headers() });
  if (!r.ok) return [];
  const rows = await r.json();
  return (Array.isArray(rows) ? rows : []).filter((row) => row.meta && row.meta.kind === 'hearth');
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
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim();
      const notes = await listNotes();
      if (!id) {
        if (isBot(ua) || req.query.embed === '1') {
          const dest = `${proto}://${host}/hearth`;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.status(200).send(card({ title: 'hearth — rankvault', desc: 'a short note by the fire. not a file cabinet.', url: dest }));
          return;
        }
        res.status(200).json({ ok: true, notes });
        return;
      }
      const row = notes.find((n) => n.id === id) || null;
      const dest = `${proto}://${host}/hearth/${encodeURIComponent(id)}`;
      if (isBot(ua) || req.query.embed === '1') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(card({
          title: row ? `${row.name} — hearth` : 'hearth — rankvault',
          desc: row ? (row.caption || 'a note by the fire') : 'that note is gone.',
          url: dest,
        }));
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'note not found' });
        return;
      }
      res.status(200).json({ ok: true, note: row });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const name = String(body.title || 'evening note').trim().slice(0, 80) || 'evening note';
      const caption = String(body.note || '').trim().slice(0, 500);
      const author = String(body.author || '').trim().slice(0, 40) || null;
      if (caption.length < 2) {
        res.status(400).json({ error: 'write a note first' });
        return;
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const row = {
        id,
        name,
        mime: 'text/plain',
        size: caption.length,
        file_url: 'https://og2vsalt-svg.github.io/rank/og.png',
        is_public: true,
        author,
        caption,
        download_count: 0,
        meta: { kind: 'hearth', source: 'hearth' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const saved = await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!saved.ok) {
        res.status(502).json({ error: 'the hearth did not keep that note', detail: (await saved.text()).slice(0, 200) });
        return;
      }
      res.status(200).json({ ok: true, id, sharePath: `/hearth/${id}` });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'hearth failed' });
  }
}
