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
function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim();
      const path = id
        ? `scupper_drips?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
        : 'scupper_drips?select=*&order=created_at.desc&limit=24';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'scupper table did not answer', detail: (await r.text()).slice(0, 180) });
        return;
      }
      res.status(200).json({ ok: true, drips: await r.json() });
      return;
    }
    if (req.method === 'POST') {
      const body = bodyOf(req);
      const drain = String(body.drain || '').trim();
      if (!drain) { res.status(400).json({ error: 'write what should drain first' }); return; }
      const row = {
        id: uid(),
        share_id: body.shareId || body.share_id || null,
        drain: drain.slice(0, 280),
        where_to: String(body.whereTo || body.where_to || '').slice(0, 120) || null,
        author: String(body.author || '').slice(0, 80) || null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/scupper_drips`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        res.status(502).json({ error: 'could not file the drip', detail: (await r.text()).slice(0, 180) });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, drip: Array.isArray(rows) ? rows[0] : rows });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'scupper failed' });
  }
}
