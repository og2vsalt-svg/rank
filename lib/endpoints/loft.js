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
function pretty(n) {
  const size = Number(n) || 0;
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return Math.max(1, Math.round(size / 1024)) + ' KB';
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
  return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    if (req.method === 'GET') {
      const id = (req.query.id || '').toString().trim();
      const path = id
        ? `lofts?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
        : 'lofts?select=id,title,caption,file_name,mime,size,file_url,author,created_at&order=created_at.desc&limit=40';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers() });
      if (!r.ok) {
        const text = await r.text();
        res.status(502).json({ error: `loft lookup failed: ${text.slice(0, 180)}` });
        return;
      }
      const rows = await r.json();
      if (id) {
        if (!rows[0]) { res.status(404).json({ error: 'loft not found' }); return; }
        const row = rows[0];
        res.status(200).json({ ...row, pretty: pretty(row.size), warn: Number(row.size) > 8 * 1024 * 1024 ? 'large drop — may be slow to open. nothing was refused.' : null });
        return;
      }
      res.status(200).json({ ok: true, lofts: rows });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = String(body.id || '').trim();
      const fileName = String(body.file_name || '').trim().slice(0, 512);
      const title = String(body.title || fileName || 'untitled loft').trim().slice(0, 120);
      if (id.length < 4 || id.length > 64 || !fileName) {
        res.status(400).json({ error: 'need an id and a file name' });
        return;
      }
      const size = Number(body.size) || 0;
      const row = {
        id,
        title,
        caption: body.caption ? String(body.caption).slice(0, 500) : null,
        file_name: fileName,
        mime: body.mime ? String(body.mime).slice(0, 120) : null,
        size,
        file_url: body.file_url ? String(body.file_url).slice(0, 2000) : null,
        author: body.author ? String(body.author).slice(0, 80) : null,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/lofts`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!r.ok) {
        const text = await r.text();
        res.status(502).json({ error: `loft write failed: ${text.slice(0, 220)}` });
        return;
      }
      const saved = await r.json();
      const share = {
        id: 'loft-' + id,
        name: fileName,
        mime: row.mime,
        size,
        file_url: row.file_url || '',
        is_public: true,
        author: row.author,
        caption: row.caption || title,
        meta: { kind: 'loft', loft_id: id, title },
      };
      await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(share),
      }).catch(() => {});
      res.status(200).json({ ok: true, loft: Array.isArray(saved) ? saved[0] : saved, warn: size > 8 * 1024 * 1024 ? 'large drop — may be slow to open. nothing was refused.' : null });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'loft failed' });
  }
}
