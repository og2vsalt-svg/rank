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
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object' && !req.readable) return Buffer.from(JSON.stringify(req.body));
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim();
      if (!id) {
        const list = await fetch(`${SUPABASE_URL}/rest/v1/letterpress?select=*&order=created_at.desc&limit=24`, { headers: headers() });
        const rows = list.ok ? await list.json() : [];
        res.status(200).json({ ok: true, cards: Array.isArray(rows) ? rows : [] });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/letterpress?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) { res.status(404).json({ error: 'that card was not found' }); return; }
      res.status(200).json({ ok: true, ...row });
      return;
    }
    if (req.method === 'POST') {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch { body = {}; }
      const title = String(body.title || '').trim().slice(0, 80);
      const text = String(body.body || '').trim().slice(0, 500);
      const author = String(body.author || '').trim().slice(0, 80);
      const accent = /^#[0-9a-fA-F]{6}$/.test(body.accent || '') ? body.accent : '#0A84FF';
      if (!title || !text) {
        res.status(400).json({ error: 'a card needs a title and a line' });
        return;
      }
      const id = uid();
      const row = { id, title, body: text, author: author || null, accent, created_at: new Date().toISOString() };
      const ins = await fetch(`${SUPABASE_URL}/rest/v1/letterpress`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!ins.ok) {
        res.status(502).json({ error: 'the card did not land', detail: (await ins.text()).slice(0, 240) });
        return;
      }
      res.status(200).json({ ok: true, id, link: `${proto}://${host}/letterpress/${encodeURIComponent(id)}` });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'letterpress failed' });
  }
}
