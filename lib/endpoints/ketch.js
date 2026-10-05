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
      const path = id ? `ketches?id=eq.${encodeURIComponent(id)}&select=*&limit=1` : 'ketches?select=*&order=created_at.desc&limit=20';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers() });
      if (!r.ok) { res.status(502).json({ error: 'ketch table did not answer', detail: (await r.text()).slice(0, 180) }); return; }
      res.status(200).json({ ok: true, ketches: await r.json() });
      return;
    }
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const sentence = String(body.sentence || '').trim();
      if (!sentence) { res.status(400).json({ error: 'write which mast carries what' }); return; }
      if (!body.mainShareId || !body.mizzenShareId) { res.status(400).json({ error: 'both files need to land first' }); return; }
      const row = {
        id: uid(),
        main_share_id: body.mainShareId,
        mizzen_share_id: body.mizzenShareId,
        main_name: String(body.mainName || 'main').slice(0, 180),
        mizzen_name: String(body.mizzenName || 'mizzen').slice(0, 180),
        sentence: sentence.slice(0, 280),
        author: String(body.author || '').slice(0, 80) || null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/ketches`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!r.ok) { res.status(502).json({ error: 'could not file the ketch', detail: (await r.text()).slice(0, 180) }); return; }
      const rows = await r.json();
      res.status(200).json({ ok: true, ketch: Array.isArray(rows) ? rows[0] : rows });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'ketch failed' });
  }
}
