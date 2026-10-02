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
      if (!id) {
        res.status(400).json({ error: 'missing id' });
        return;
      }
      const roomRes = await fetch(`${SUPABASE_URL}/rest/v1/ferry_rooms?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
      const rooms = await roomRes.json();
      if (!roomRes.ok || !Array.isArray(rooms) || !rooms[0]) {
        res.status(404).json({ error: 'room not found' });
        return;
      }
      const itemRes = await fetch(`${SUPABASE_URL}/rest/v1/ferry_items?room_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`, { headers: headers() });
      const items = await itemRes.json();
      res.status(200).json({ ok: true, room: rooms[0], items: Array.isArray(items) ? items : [] });
      return;
    }
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(await read(req) || '{}');
      if (body.roomId && body.item) {
        const item = {
          id: uid(),
          room_id: String(body.roomId).slice(0, 64),
          share_id: body.item.shareId || null,
          name: String(body.item.name || 'file').slice(0, 512),
          mime: body.item.mime || null,
          size: Number(body.item.size) || 0,
          file_url: body.item.fileUrl || null,
        };
        const up = await fetch(`${SUPABASE_URL}/rest/v1/ferry_items`, { method: 'POST', headers: headers(), body: JSON.stringify(item) });
        const rows = await up.json().catch(() => null);
        if (!up.ok) {
          res.status(502).json({ error: 'item not saved', detail: JSON.stringify(rows).slice(0, 240) });
          return;
        }
        res.status(200).json({ ok: true, item: Array.isArray(rows) ? rows[0] : item });
        return;
      }
      const room = {
        id: uid(),
        title: String(body.title || 'untitled room').slice(0, 140),
        note: body.note ? String(body.note).slice(0, 2000) : null,
        author: body.author ? String(body.author).slice(0, 80) : null,
      };
      const up = await fetch(`${SUPABASE_URL}/rest/v1/ferry_rooms`, { method: 'POST', headers: headers(), body: JSON.stringify(room) });
      const rows = await up.json().catch(() => null);
      if (!up.ok) {
        res.status(502).json({ error: 'room not saved', detail: JSON.stringify(rows).slice(0, 240) });
        return;
      }
      res.status(200).json({ ok: true, room: Array.isArray(rows) ? rows[0] : room });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'ferry failed' });
  }
}

function read(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
