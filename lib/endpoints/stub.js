const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
}
async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object' && !req.readable) return Buffer.from(JSON.stringify(req.body));
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim();
      if (!id) {
        const list = await fetch(`${SUPABASE_URL}/rest/v1/stubs?select=id,label,for_whom,note,author,file_name,mime,size,file_url,handed_at,accent,created_at&order=created_at.desc&limit=40`, { headers: headers() });
        const rows = list.ok ? await list.json() : [];
        res.status(200).json({ ok: true, stubs: Array.isArray(rows) ? rows.map((row) => ({ ...row, pretty: prettySize(row.size) })) : [] });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/stubs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) { res.status(404).json({ error: 'that stub was not found' }); return; }
      const warn = Number(row.size) > 12 * 1024 * 1024 ? 'large stub. the download may feel slow.' : null;
      res.status(200).json({ ok: true, ...row, pretty: prettySize(row.size), warn });
      return;
    }
    if (req.method === 'POST') {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch { body = {}; }
      const id = String(body.id || '').trim().slice(0, 40);
      const label = String(body.label || '').trim().slice(0, 120);
      const forWhom = String(body.forWhom || body.for_whom || '').trim().slice(0, 80);
      const note = String(body.note || '').trim().slice(0, 400);
      const author = String(body.author || '').trim().slice(0, 80);
      const fileName = String(body.fileName || '').trim().slice(0, 180);
      const mime = String(body.mime || 'application/octet-stream').slice(0, 120);
      const size = Number(body.size) || 0;
      const fileUrl = String(body.fileUrl || '').trim();
      const accent = /^#[0-9a-fA-F]{6}$/.test(body.accent || '') ? body.accent : '#30D158';
      if (!id || !label) {
        res.status(400).json({ error: 'a label is required' });
        return;
      }
      if (fileUrl && !/^https?:\/\//i.test(fileUrl)) {
        res.status(400).json({ error: 'the file url has to be a real http link' });
        return;
      }
      const row = {
        id,
        label,
        for_whom: forWhom || null,
        note: note || null,
        author: author || null,
        file_name: fileName || null,
        mime: fileUrl ? mime : null,
        size: fileUrl ? size : 0,
        file_url: fileUrl || null,
        share_id: body.shareId || null,
        handed_at: null,
        accent,
        created_at: new Date().toISOString(),
      };
      const ins = await fetch(`${SUPABASE_URL}/rest/v1/stubs`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!ins.ok) {
        res.status(502).json({ error: 'the stub did not land', detail: (await ins.text()).slice(0, 240) });
        return;
      }
      const warn = size > 12 * 1024 * 1024 ? 'large stub. the browser may feel slow while it sends. it was not refused.' : null;
      res.status(200).json({ ok: true, id, warn, link: `${proto}://${host}/stub/${encodeURIComponent(id)}` });
      return;
    }
    if (req.method === 'PATCH') {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch { body = {}; }
      const id = String(body.id || '').trim().slice(0, 40);
      if (!id) { res.status(400).json({ error: 'id is required' }); return; }
      const patch = await fetch(`${SUPABASE_URL}/rest/v1/stubs?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ handed_at: new Date().toISOString() }),
      });
      if (!patch.ok) {
        res.status(502).json({ error: 'the stub did not stamp', detail: (await patch.text()).slice(0, 240) });
        return;
      }
      res.status(200).json({ ok: true, id });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'stub failed' });
  }
}
