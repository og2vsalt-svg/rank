const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim();
      const path = id ? `luffs?id=eq.${encodeURIComponent(id)}&select=*&limit=1` : 'luffs?select=*&order=created_at.desc&limit=20';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers() });
      if (!r.ok) { res.status(502).json({ error: 'luff table did not answer', detail: (await r.text()).slice(0, 180) }); return; }
      res.status(200).json({ ok: true, luffs: await r.json() });
      return;
    }
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const heading = String(body.heading || '').trim();
      if (!heading) { res.status(400).json({ error: 'a heading is required' }); return; }
      const row = {
        id: uid(),
        share_id: body.shareId || null,
        heading: heading.slice(0, 80),
        wind: String(body.wind || '').slice(0, 80) || null,
        note: String(body.note || '').slice(0, 280) || null,
        author: String(body.author || '').slice(0, 80) || null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/luffs`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!r.ok) { res.status(502).json({ error: 'could not file the luff', detail: (await r.text()).slice(0, 180) }); return; }
      const rows = await r.json();
      res.status(200).json({ ok: true, luff: Array.isArray(rows) ? rows[0] : rows });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'luff failed' });
  }
}
