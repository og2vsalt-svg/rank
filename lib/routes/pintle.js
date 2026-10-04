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
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim();
      const path = id
        ? `pintles?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
        : 'pintles?select=*&order=created_at.desc&limit=24';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'pintle table did not answer', detail: (await r.text()).slice(0, 180) });
        return;
      }
      res.status(200).json({ ok: true, pintles: await r.json() });
      return;
    }
    if (req.method === 'POST') {
      const body = bodyOf(req);
      const purpose = String(body.purpose || '').trim();
      const opensToward = String(body.opensToward || '').trim();
      const shareId = String(body.shareId || '').trim();
      if (!purpose || !opensToward || !shareId) {
        res.status(400).json({ error: 'a purpose, a direction, and a filed share are required' });
        return;
      }
      const row = {
        id: uid(),
        purpose: purpose.slice(0, 160),
        opens_toward: opensToward.slice(0, 80),
        note: body.note ? String(body.note).slice(0, 800) : null,
        share_id: shareId.slice(0, 64),
        file_name: body.fileName ? String(body.fileName).slice(0, 240) : null,
        author: body.author ? String(body.author).slice(0, 80) : null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/pintles`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!r.ok) {
        res.status(502).json({ error: 'could not file the pintle', detail: (await r.text()).slice(0, 180) });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, pintle: Array.isArray(rows) ? rows[0] : rows, card: `/pintle/${row.id}` });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'pintle failed' });
  }
}
