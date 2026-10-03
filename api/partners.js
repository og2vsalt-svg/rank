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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  const board = String(req.query.board || 'main').slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '') || 'main';
  try {
    if (req.method === 'GET') {
      const url = `${SUPABASE_URL}/rest/v1/hawser_notes?board=eq.${encodeURIComponent(board)}&select=id,body,author,share_id,accent,created_at&order=created_at.desc&limit=40`;
      const r = await fetch(url, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'board read failed', notes: [] });
        return;
      }
      res.status(200).json({ ok: true, notes: await r.json() });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      const text = String(body.body || '').trim().slice(0, 500);
      if (!text) {
        res.status(400).json({ error: 'line required' });
        return;
      }
      const name = String(body.board || board).slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '') || 'main';
      const row = {
        id: uid(),
        board: name,
        body: text,
        author: body.author ? String(body.author).slice(0, 40) : null,
        share_id: body.shareId ? String(body.shareId).slice(0, 64) : null,
        accent: '#30D158',
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/hawser_notes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        res.status(502).json({ error: await r.text() });
        return;
      }
      res.status(200).json({ ok: true, id: row.id, card: `/partners?b=${name}` });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'partners failed' });
  }
}
