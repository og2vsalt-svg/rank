const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

export const config = { api: { bodyParser: false } };

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function parseMultipart(buf, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!match) return null;
  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const parts = [];
  let start = buf.indexOf(boundary);
  if (start === -1) return parts;
  start += boundary.length;
  while (start < buf.length) {
    if (buf.slice(start, start + 2).toString() === '--') break;
    if (buf.slice(start, start + 2).toString() === '\r\n') start += 2;
    const next = buf.indexOf(boundary, start);
    if (next === -1) break;
    const chunk = buf.slice(start, next - 2);
    const sep = chunk.indexOf('\r\n\r\n');
    if (sep !== -1) {
      const head = chunk.slice(0, sep).toString('utf8');
      parts.push({
        name: /name="([^"]+)"/.exec(head)?.[1] || '',
        filename: /filename="([^"]*)"/.exec(head)?.[1] || '',
        type: /Content-Type:\s*([^\r\n]+)/i.exec(head)?.[1] || 'application/octet-stream',
        body: chunk.slice(sep + 4),
      });
    }
    start = next + boundary.length;
  }
  return parts;
}

async function storeBytes({ id, name, type, buf }) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'file';
  const objectPath = `deadeye/${id}/${safeName}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/shares/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': type,
      'x-upsert': 'true',
      'cache-control': 'public, max-age=31536000',
    },
    body: buf,
  });
  if (!up.ok) {
    const detail = await up.text();
    throw new Error(detail.slice(0, 180) || 'storage refused the file');
  }
  return `${SUPABASE_URL}/storage/v1/object/public/shares/${objectPath}`;
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
        const r = await fetch(`${SUPABASE_URL}/rest/v1/deadeyes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
        const rows = r.ok ? await r.json() : [];
        if (!rows[0]) {
          res.status(404).json({ error: 'witness not found' });
          return;
        }
        res.status(200).json({ ok: true, deadeye: rows[0] });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/deadeyes?select=id,witness,saw,name,mime,size,author,created_at,file_url&order=created_at.desc&limit=24`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ ok: true, deadeyes: Array.isArray(rows) ? rows : [] });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }

    const raw = await readBody(req);
    const parts = parseMultipart(raw, req.headers['content-type'] || '') || [];
    const file = parts.find((p) => p.filename || p.name === 'file');
    if (!file || !file.body || !file.body.length) {
      res.status(400).json({ error: 'file field required' });
      return;
    }
    const field = (key) => parts.find((p) => p.name === key)?.body.toString('utf8').trim() || '';
    const id = (field('id') || uid()).slice(0, 64);
    const witness = (field('witness') || 'unnamed').slice(0, 80);
    const saw = field('saw').slice(0, 280);
    if (!saw) {
      res.status(400).json({ error: 'say what you saw. one line is enough.' });
      return;
    }
    const author = (field('author') || 'deadeye').slice(0, 60);
    const name = (file.filename || 'file').slice(0, 240);
    const type = file.type || 'application/octet-stream';
    const size = file.body.length;
    const warn = size > 8 * 1024 * 1024 ? 'heavy file. the write can feel slow. it is still accepted.' : null;
    const fileUrl = await storeBytes({ id, name, type, buf: file.body });
    const row = {
      id,
      witness,
      saw,
      name,
      mime: type,
      size,
      file_url: fileUrl,
      author,
    };
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/deadeyes`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(row),
    });
    if (!ins.ok) {
      const detail = await ins.text();
      res.status(502).json({ error: 'the deadeyes table did not take the row', detail: detail.slice(0, 200), warn });
      return;
    }
    res.status(200).json({
      ok: true,
      id,
      url: fileUrl,
      sharePath: `/deadeye/${id}`,
      embedPath: `/deadeye/${id}`,
      warn,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'deadeye failed' });
  }
}
