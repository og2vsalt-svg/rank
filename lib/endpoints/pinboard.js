const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  try {
    if (req.method === 'GET') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=24`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ ok: true, pins: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const url = String(body.url || '').trim().slice(0, 2000);
      if (!/^https?:\/\//i.test(url)) {
        res.status(400).json({ error: 'need a http or https url' });
        return;
      }
      const note = String(body.note || '').trim().slice(0, 180) || null;
      const author = String(body.author || '').trim().slice(0, 40) || null;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/links`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ url, note, author }),
      });
      if (!r.ok) {
        res.status(502).json({ error: 'links table did not accept the pin' });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, pin: Array.isArray(rows) ? rows[0] : rows });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'pinboard failed' });
  }
}
