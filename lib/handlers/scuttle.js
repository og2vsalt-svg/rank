const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function sb(path, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers || {}) },
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

function card(title, desc, url) {
  const img = 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#0A84FF" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${img}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${img}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.14em;text-transform:uppercase;font-size:12px">scuttle</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const ua = req.headers['user-agent'] || '';
  const bot = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely/i.test(ua);
  const id = String((req.query && req.query.id) || '').trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const pageUrl = `${proto}://${host}/scuttle${id ? '/' + encodeURIComponent(id) : ''}`;

  if (req.method === 'GET' && (bot || req.query.embed === '1')) {
    let title = 'scuttle — a hatch, not a drawer';
    let desc = 'Pin a note and drop a local file into the share table. Large files are warned, never refused.';
    if (id) {
      const row = await sb(`public_shares?id=eq.${encodeURIComponent(id)}&select=name,caption,meta,size&limit=1`);
      const item = Array.isArray(row.data) ? row.data[0] : null;
      if (item) {
        title = (item.meta && item.meta.cardTitle) || item.name || title;
        desc = item.caption || desc;
      }
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(card(title, desc, pageUrl));
  }

  if (req.method === 'GET' && req.query.list === '1') {
    const row = await sb('public_shares?author=eq.scuttle&is_public=eq.true&select=id,name,caption,size,mime,created_at,meta&order=created_at.desc&limit=24');
    return res.status(200).json({ ok: row.ok, hatches: row.data || [] });
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const note = String(body.note || '').slice(0, 280);
    const fileId = String(body.fileId || '').trim().slice(0, 64);
    const title = String(body.title || 'open hatch').slice(0, 80);
    if (!fileId) return res.status(400).json({ error: 'drop the file first — the hatch only files what landed in the share table' });
    const patch = await sb(`public_shares?id=eq.${encodeURIComponent(fileId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        author: 'scuttle',
        caption: note || title,
        meta: { source: 'scuttle', cardTitle: title, caption: note || title },
        updated_at: new Date().toISOString(),
      }),
    });
    if (!patch.ok) return res.status(patch.status || 502).json({ error: 'the hatch did not close', detail: patch.data });
    return res.status(200).json({ ok: true, id: fileId, path: `/scuttle/${fileId}`, filePath: `/s/${fileId}` });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
