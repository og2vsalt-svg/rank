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
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"/><meta name="theme-color" content="#0A84FF"/><meta property="og:type" content="website"/><meta property="og:site_name" content="rankvault"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(desc)}"/><meta property="og:image" content="${esc(img)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:url" content="${esc(url)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(desc)}"/><meta name="twitter:image" content="${esc(img)}"/></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.08em;text-transform:uppercase;font-size:13px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

async function sbGet(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/windlass_turns?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
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
    if (page === 'windlass' || (req.method === 'GET' && id && isBot(req.headers['user-agent']))) {
      const row = id ? await sbGet(id) : null;
      const dest = id ? `${proto}://${host}/windlass/${encodeURIComponent(id)}` : `${proto}://${host}/windlass`;
      const image = row && String(row.mime || '').startsWith('image/') ? undefined : undefined;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      res.status(200).send(cardHtml({
        title: row ? `${row.file_name} — windlass` : 'windlass — rankvault',
        desc: row
          ? `${row.note || 'a haul, not a drawer'} · ${prettySize(row.size)}${row.for_whom ? ' · for ' + row.for_whom : ''}`
          : 'Haul a local file into the share table and keep who turned the windlass. Large files are warned, never refused.',
        url: dest,
        image,
      }));
      return;
    }
    if (req.method === 'GET') {
      if (id) {
        const row = await sbGet(id);
        if (!row) {
          res.status(404).json({ error: 'turn not found' });
          return;
        }
        res.status(200).json({ ok: true, turn: row });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/windlass_turns?select=*&order=created_at.desc&limit=24`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ ok: true, turns: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const fileName = String(body.file_name || body.fileName || '').trim().slice(0, 512);
      if (!fileName) {
        res.status(400).json({ error: 'file name required' });
        return;
      }
      const row = {
        id: String(body.id || Date.now().toString(36)).slice(0, 64),
        share_id: body.share_id ? String(body.share_id).slice(0, 64) : null,
        file_name: fileName,
        mime: body.mime ? String(body.mime).slice(0, 120) : null,
        size: Math.max(0, Number(body.size) || 0),
        sha256: body.sha256 ? String(body.sha256).slice(0, 80) : null,
        hauled_by: body.hauled_by ? String(body.hauled_by).slice(0, 60) : null,
        for_whom: body.for_whom ? String(body.for_whom).slice(0, 60) : null,
        note: body.note ? String(body.note).slice(0, 280) : null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/windlass_turns`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        const detail = await r.text();
        res.status(502).json({ error: 'windlass table did not take the turn', detail: detail.slice(0, 240) });
        return;
      }
      const saved = await r.json();
      const turn = Array.isArray(saved) ? saved[0] : saved;
      res.status(200).json({ ok: true, turn, path: `/windlass/${turn.id}` });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'windlass failed' });
  }
}
