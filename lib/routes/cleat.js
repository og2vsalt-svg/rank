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

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  try {
    if (req.method === 'GET') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=20`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ ok: true, rows: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    const url = String(body.url || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      res.status(400).json({ error: 'need a full http(s) address' });
      return;
    }
    const row = {
      url: url.slice(0, 2000),
      note: body.note ? String(body.note).slice(0, 280) : null,
      author: body.author ? String(body.author).slice(0, 80) : 'cleat',
    };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/links`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: 'links shelf refused the pin', detail: text.slice(0, 240) });
      return;
    }
    const rows = await r.json();
    res.status(200).json({ ok: true, row: Array.isArray(rows) ? rows[0] : row });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'cleat failed' });
  }
}
