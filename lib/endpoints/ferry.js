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
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const id = (req.query.id || '').toString().trim();
      if (!id) return res.status(400).json({ error: 'missing id' });
      const roomRes = await fetch(`${SUPABASE_URL}/rest/v1/gammon_rooms?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
      const rooms = roomRes.ok ? await roomRes.json() : [];
      if (!rooms[0]) return res.status(404).json({ error: 'room missing' });
      const itemRes = await fetch(`${SUPABASE_URL}/rest/v1/gammon_items?room_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`, { headers: headers() });
      const items = itemRes.ok ? await itemRes.json() : [];
      return res.status(200).json({ ok: true, room: rooms[0], items });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (body.roomId && body.item) {
        const item = body.item;
        const row = { room_id: String(body.roomId).slice(0, 64), share_id: item.shareId || null, name: String(item.name || 'file').slice(0, 512), mime: item.mime || null, size: Number(item.size) || 0, file_url: item.fileUrl || null };
        const r = await fetch(`${SUPABASE_URL}/rest/v1/gammon_items`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
        if (!r.ok) return res.status(502).json({ error: 'room note failed', detail: (await r.text()).slice(0, 200) });
        const saved = await r.json();
        return res.status(200).json({ ok: true, item: Array.isArray(saved) ? saved[0] : saved });
      }
      const id = uid();
      const row = { id, title: String(body.title || 'untitled room').slice(0, 140), note: body.note ? String(body.note).slice(0, 280) : null };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/gammon_rooms`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!r.ok) return res.status(502).json({ error: 'room did not open', detail: (await r.text()).slice(0, 200) });
      const saved = await r.json();
      return res.status(200).json({ ok: true, room: Array.isArray(saved) ? saved[0] : saved });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'ferry failed' });
  }
}
