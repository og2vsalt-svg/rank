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

  if (req.method === 'GET') {
    const id = (req.query.id || '').toString().trim();
    const url = id
      ? `${SUPABASE_URL}/rest/v1/treenails?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
      : `${SUPABASE_URL}/rest/v1/treenails?select=id,label,note,share_id,file_name,author,accent,created_at&order=created_at.desc&limit=24`;
    const r = await fetch(url, { headers: headers() });
    const rows = r.ok ? await r.json() : [];
    if (!r.ok) {
      res.status(502).json({ error: 'treenail board did not answer' });
      return;
    }
    res.status(200).json(id ? rows[0] || null : { ok: true, pins: rows });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const label = String(body.label || '').trim().slice(0, 140);
  if (!label) {
    res.status(400).json({ error: 'a pin needs a label' });
    return;
  }
  const id = String(body.id || uid()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) || uid();
  const row = {
    id,
    label,
    note: body.note ? String(body.note).slice(0, 280) : null,
    share_id: body.shareId ? String(body.shareId).slice(0, 64) : null,
    file_name: body.fileName ? String(body.fileName).slice(0, 180) : null,
    author: body.author ? String(body.author).slice(0, 60) : 'treenail',
    accent: /^#[0-9a-fA-F]{6}$/.test(body.accent || '') ? body.accent : '#30D158',
  };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/treenails`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(row),
  });
  const text = await r.text();
  if (!r.ok) {
    res.status(502).json({ error: text.slice(0, 240) || 'pin was not written' });
    return;
  }
  res.status(200).json({ ok: true, id, card: `/treenail/${id}` });
}
