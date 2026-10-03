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

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
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
      if (!id) {
        res.status(400).json({ error: 'missing id' });
        return;
      }
      const url = `${SUPABASE_URL}/rest/v1/taffrail_notes?share_id=eq.${encodeURIComponent(id)}&select=id,share_id,body,author,created_at&order=created_at.asc&limit=80`;
      const r = await fetch(url, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'notes unavailable' });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, notes: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'POST') {
      const body = await readJson(req);
      const shareId = (body.share_id || body.shareId || '').toString().trim().slice(0, 64);
      const text = (body.body || '').toString().trim().slice(0, 280);
      const author = (body.author || '').toString().trim().slice(0, 80) || null;
      if (!shareId || !text) {
        res.status(400).json({ error: 'share id and a note are required' });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/taffrail_notes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ share_id: shareId, body: text, author }),
      });
      if (!r.ok) {
        const detail = await r.text();
        res.status(502).json({ error: 'note was not written', detail: detail.slice(0, 180) });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, note: Array.isArray(rows) ? rows[0] : rows });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'taffrail failed' });
  }
}
