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
      const r = await fetch(`${SUPABASE_URL}/rest/v1/cuddy_notes?select=id,body,author,tone,created_at&order=created_at.desc&limit=40`, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'notes table did not answer', detail: (await r.text()).slice(0, 180) });
        return;
      }
      res.status(200).json({ ok: true, notes: await r.json() });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      const text = String(body.body || '').trim();
      if (!text) {
        res.status(400).json({ error: 'write a line first' });
        return;
      }
      const row = {
        id: (body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toString().slice(0, 64),
        body: text.slice(0, 2000),
        author: body.author ? String(body.author).slice(0, 80) : null,
        tone: ['note', 'handoff', 'later'].includes(body.tone) ? body.tone : 'note',
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/cuddy_notes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        res.status(502).json({ error: 'could not file the note', detail: (await r.text()).slice(0, 180) });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, note: Array.isArray(rows) ? rows[0] : rows });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'cuddy failed' });
  }
}
