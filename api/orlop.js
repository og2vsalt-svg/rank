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

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
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
      if (id) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/handoffs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
        const rows = r.ok ? await r.json() : [];
        res.status(r.ok ? 200 : 502).json({ ok: r.ok, row: Array.isArray(rows) ? rows[0] || null : null });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/handoffs?select=id,name,mime,size,note,recipient,author,share_id,created_at&order=created_at.desc&limit=16`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ ok: true, rows: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'POST') {
      const body = await readJson(req);
      const name = String(body.name || 'file').slice(0, 512);
      const note = String(body.note || '').slice(0, 500);
      const recipient = String(body.recipient || '').slice(0, 80);
      const size = Number(body.size) || 0;
      const id = uid();
      const row = {
        id,
        share_id: body.shareId ? String(body.shareId).slice(0, 80) : null,
        name,
        mime: body.mime ? String(body.mime).slice(0, 120) : null,
        size: size < 0 ? 0 : size,
        file_url: typeof body.fileUrl === 'string' ? body.fileUrl.slice(0, 2000) : null,
        note: note || null,
        recipient: recipient || null,
        author: body.author ? String(body.author).slice(0, 80) : 'orlop',
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/handoffs`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        const text = await r.text();
        res.status(502).json({ error: 'handoff table refused the row', detail: text.slice(0, 240) });
        return;
      }
      const rows = await r.json();
      const saved = Array.isArray(rows) ? rows[0] : row;
      const warn = size > 12 * 1024 * 1024 ? 'large handoff. the tab may feel slow. nothing was refused.' : null;
      res.status(200).json({ ok: true, id: saved.id || id, warn });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'orlop failed' });
  }
}
