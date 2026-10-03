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
      const shareId = String(req.query.shareId || '').trim().slice(0, 64);
      if (!shareId) {
        res.status(400).json({ error: 'shareId required' });
        return;
      }
      const url = `${SUPABASE_URL}/rest/v1/share_margins?share_id=eq.${encodeURIComponent(shareId)}&select=id,share_id,body,author,created_at&order=created_at.asc&limit=80`;
      const r = await fetch(url, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'margins table did not answer' });
        return;
      }
      res.status(200).json({ ok: true, margins: await r.json() });
      return;
    }
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const shareId = String(body.shareId || '').trim().slice(0, 64);
      const line = String(body.body || '').trim().slice(0, 500);
      const author = String(body.author || 'pintle').trim().slice(0, 80) || 'pintle';
      if (!shareId || !line) {
        res.status(400).json({ error: 'shareId and body required' });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/share_margins`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ share_id: shareId, body: line, author }),
      });
      if (!r.ok) {
        res.status(502).json({ error: 'margin was not written', detail: (await r.text()).slice(0, 180) });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, margin: Array.isArray(rows) ? rows[0] : rows });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'margins failed' });
  }
}
