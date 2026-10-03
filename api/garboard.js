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
      const r = await fetch(`${SUPABASE_URL}/rest/v1/garboard_seams?select=id,left_id,right_id,note,author,created_at&order=created_at.desc&limit=30`, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'seam table did not answer' });
        return;
      }
      res.status(200).json({ ok: true, seams: await r.json() });
      return;
    }
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const leftId = String(body.leftId || '').trim().slice(0, 64);
      const rightId = String(body.rightId || '').trim().slice(0, 64);
      const note = String(body.note || '').trim().slice(0, 400);
      if (!leftId || !rightId || !note) {
        res.status(400).json({ error: 'leftId, rightId, and note required' });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/garboard_seams`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          left_id: leftId,
          right_id: rightId,
          note,
          author: String(body.author || 'garboard').trim().slice(0, 80),
        }),
      });
      if (!r.ok) {
        res.status(502).json({ error: 'seam was not written', detail: (await r.text()).slice(0, 180) });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, seam: Array.isArray(rows) ? rows[0] : rows });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'garboard failed' });
  }
}
