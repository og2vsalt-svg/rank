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

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  try {
    if (req.method === 'GET') {
      const id = (req.query.id || '').toString().trim();
      const url = id
        ? `${SUPABASE_URL}/rest/v1/waybills?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
        : `${SUPABASE_URL}/rest/v1/waybills?select=*&order=created_at.desc&limit=20`;
      const r = await fetch(url, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'waybills unreadable' });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, waybills: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const destination = String(body.destination || '').trim().slice(0, 300);
      if (!destination) {
        res.status(400).json({ error: 'destination required' });
        return;
      }
      const row = {
        id: String(body.id || Date.now().toString(36)).slice(0, 64),
        destination,
        note: body.note ? String(body.note).slice(0, 800) : null,
        share_id: body.shareId ? String(body.shareId).slice(0, 64) : null,
        file_name: body.fileName ? String(body.fileName).slice(0, 240) : null,
        file_url: body.fileUrl ? String(body.fileUrl).slice(0, 2000) : null,
        author: body.author ? String(body.author).slice(0, 80) : null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/waybills`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        res.status(502).json({ error: (await r.text()).slice(0, 240) });
        return;
      }
      const saved = await r.json();
      res.status(200).json({ ok: true, waybill: Array.isArray(saved) ? saved[0] : saved, card: `/waybill` });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'waybill failed' });
  }
}
