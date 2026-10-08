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
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function pretty(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
function shape(row) {
  if (!row) return null;
  const size = Number(row.size) || 0;
  return { ...row, size, pretty: pretty(size), warn: size > 12 * 1024 * 1024 ? 'large pin. opening the file may feel slow. nothing was refused.' : null };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    if (req.method === 'GET') {
      if (req.query.list === '1' || String(req.query.name || '') === 'voussoir') {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/keystones?select=*&order=created_at.desc&limit=40`, { headers: headers() });
        const rows = r.ok ? await r.json() : [];
        res.status(200).json({ ok: true, pins: (Array.isArray(rows) ? rows : []).map(shape) });
        return;
      }
      const id = (req.query.id || '').toString().trim();
      if (!id) { res.status(400).json({ error: 'missing id' }); return; }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/keystones?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) { res.status(404).json({ error: 'pin not found' }); return; }
      res.status(200).json(shape(row));
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      const id = String(body.id || '').slice(0, 64);
      const place = String(body.place || '').trim().slice(0, 160);
      if (!id || !place) { res.status(400).json({ error: 'place and id required' }); return; }
      const size = Number(body.size) || 0;
      const row = {
        id,
        place,
        reading: body.reading ? String(body.reading).slice(0, 500) : null,
        file_name: body.file_name ? String(body.file_name).slice(0, 240) : null,
        mime: body.mime ? String(body.mime).slice(0, 120) : null,
        size,
        file_url: body.file_url ? String(body.file_url).slice(0, 2000) : null,
        author: body.author ? String(body.author).slice(0, 80) : null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/keystones`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!r.ok) {
        const text = await r.text();
        res.status(502).json({ error: 'could not write the pin', detail: text.slice(0, 240) });
        return;
      }
      const saved = await r.json();
      const pin = Array.isArray(saved) ? saved[0] : saved;
      res.status(200).json({ ok: true, id, embedPath: `/keystone/${id}`, warn: size > 12 * 1024 * 1024 ? 'large pin. opening the file may feel slow. nothing was refused.' : null, pin: shape(pin) });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'keystone failed' });
  }
}
