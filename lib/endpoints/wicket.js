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
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object' && !req.readable) return Buffer.from(JSON.stringify(req.body));
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}
async function storeFile(id, name, type, buf) {
  const safe = String(name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 140) || 'file';
  const path = `wicket/${id}/${safe}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/shares/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': type || 'application/octet-stream', 'x-upsert': 'true' },
    body: buf,
  });
  if (!up.ok) return { url: null, detail: (await up.text()).slice(0, 180) };
  return { url: `${SUPABASE_URL}/storage/v1/object/public/shares/${path}` };
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
        const list = await fetch(`${SUPABASE_URL}/rest/v1/wickets?select=*&order=created_at.desc&limit=18`, { headers: headers() });
        const rows = list.ok ? await list.json() : [];
        res.status(200).json({ ok: true, wickets: Array.isArray(rows) ? rows : [] });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/wickets?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) { res.status(404).json({ error: 'that wicket was not found' }); return; }
      const warn = Number(row.size) > 8 * 1024 * 1024 ? 'large drop. opening it may feel slow.' : null;
      res.status(200).json({ ok: true, ...row, warn, pretty: prettySize(row.size) });
      return;
    }
    if (req.method === 'POST') {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch { body = {}; }
      const caller = String(body.caller || '').trim().slice(0, 80);
      const note = String(body.note || '').trim().slice(0, 280);
      const name = String(body.name || 'file').slice(0, 240);
      const type = String(body.type || 'application/octet-stream').slice(0, 120);
      const accent = /^#[0-9a-fA-F]{6}$/.test(body.accent || '') ? body.accent : '#0A84FF';
      const dataUrl = String(body.dataUrl || '');
      if (!dataUrl.startsWith('data:')) {
        res.status(400).json({ error: 'choose a local file to pass through the wicket' });
        return;
      }
      const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) { res.status(400).json({ error: 'could not read that file' }); return; }
      const buf = Buffer.from(m[2], 'base64');
      const id = uid();
      const warn = buf.length > 8 * 1024 * 1024 ? 'large drop. the host may feel slow while it writes. it was not refused.' : null;
      const stored = await storeFile(id, name, type, buf);
      let fileUrl = stored.url;
      if (!fileUrl && buf.length <= 700 * 1024) fileUrl = dataUrl;
      if (!fileUrl) {
        res.status(502).json({ error: 'storage did not take the file. it was not refused for size. retry.', detail: stored.detail || null, warn });
        return;
      }
      const row = {
        id,
        caller: caller || null,
        note: note || null,
        file_name: name,
        mime: type,
        size: buf.length,
        file_url: fileUrl,
        accent,
        created_at: new Date().toISOString(),
      };
      const ins = await fetch(`${SUPABASE_URL}/rest/v1/wickets`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!ins.ok) {
        res.status(502).json({ error: 'the wicket did not land in the table', detail: (await ins.text()).slice(0, 240) });
        return;
      }
      const share = {
        id,
        name,
        mime: type,
        size: buf.length,
        file_url: fileUrl,
        is_public: true,
        download_count: 0,
        author: caller || null,
        caption: note || null,
        meta: { desk: 'wicket', caller, note, accent, warn, cardTitle: name },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, { method: 'POST', headers: headers(), body: JSON.stringify(share) }).catch(() => null);
      res.status(200).json({ ok: true, id, link: `${proto}://${host}/wicket/${encodeURIComponent(id)}`, warn, size: buf.length, file_url: fileUrl.startsWith('data:') ? null : fileUrl });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'wicket failed' });
  }
}
