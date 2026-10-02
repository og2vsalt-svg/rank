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

  if (req.method === 'GET') {
    const id = (req.query.id || '').toString().trim();
    const url = id
      ? `${SUPABASE_URL}/rest/v1/parcels?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
      : `${SUPABASE_URL}/rest/v1/parcels?select=id,title,note,author,accent,items,created_at&order=created_at.desc&limit=24`;
    const r = await fetch(url, { headers: headers() });
    const rows = r.ok ? await r.json() : [];
    res.status(r.ok ? 200 : 502).json(id ? (rows[0] || null) : rows);
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const id = String(body.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  if (id.length < 4 || !items.length) {
    res.status(400).json({ error: 'need an id and at least one filed item' });
    return;
  }
  const row = {
    id,
    title: String(body.title || 'satchel').slice(0, 120),
    note: body.note ? String(body.note).slice(0, 280) : null,
    author: body.author ? String(body.author).slice(0, 60) : null,
    accent: /^#[0-9a-fA-F]{6}$/.test(body.accent || '') ? body.accent : '#0A84FF',
    items: items.map((it) => ({
      id: String(it.id || ''),
      name: String(it.name || 'file').slice(0, 180),
      mime: String(it.mime || ''),
      size: Number(it.size) || 0,
      file_url: String(it.file_url || ''),
    })),
  };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/parcels`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(row),
  });
  const text = await r.text();
  if (!r.ok) {
    res.status(502).json({ error: text.slice(0, 240) || 'parcel write failed' });
    return;
  }
  res.status(200).json({ ok: true, id, card: `/parcel/${id}` });
}
