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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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
      const filter = id ? `&id=eq.${encodeURIComponent(id)}` : '';
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/tiller_slips?select=id,body,author,share_id,created_at&order=created_at.desc&limit=24${filter}`,
        { headers: headers() },
      );
      if (!r.ok) {
        res.status(502).json({ error: 'log unreadable' });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, slips: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const text = String(body.body || '').trim().slice(0, 2000);
      if (!text) {
        res.status(400).json({ error: 'write a line first' });
        return;
      }
      const row = {
        id: uid(),
        body: text,
        author: body.author ? String(body.author).slice(0, 40) : null,
        share_id: body.shareId ? String(body.shareId).slice(0, 64) : null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tiller_slips`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        const detail = await r.text();
        res.status(502).json({ error: 'could not keep the line', detail: detail.slice(0, 180) });
        return;
      }
      const saved = await r.json();
      const slip = Array.isArray(saved) ? saved[0] : saved;
      res.status(200).json({ ok: true, slip, path: `/tiller/${slip.id}` });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'tiller failed' });
  }
}
