import { createHash } from 'node:crypto';

export const config = { api: { bodyParser: false } };

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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function sbHeaders() {
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
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!boundaryMatch) return [];
  const boundary = Buffer.from('--' + (boundaryMatch[1] || boundaryMatch[2]).trim());
  const parts = [];
  let start = buf.indexOf(boundary);
  while (start !== -1) {
    start += boundary.length;
    if (buf.slice(start, start + 2).toString() === '--') break;
    if (buf.slice(start, start + 2).toString() === '\r\n') start += 2;
    const next = buf.indexOf(boundary, start);
    if (next === -1) break;
    const chunk = buf.slice(start, Math.max(start, next - 2));
    const sep = chunk.indexOf('\r\n\r\n');
    if (sep !== -1) {
      const head = chunk.slice(0, sep).toString('utf8');
      const body = chunk.slice(sep + 4);
      parts.push({
        name: /name="([^"]+)"/.exec(head)?.[1] || '',
        filename: /filename="([^"]*)"/.exec(head)?.[1] || '',
        type: /Content-Type:\s*([^\r\n]+)/i.exec(head)?.[1] || 'application/octet-stream',
        body,
      });
    }
    start = next;
  }
  return parts;
}

function warnFor(size) {
  if (size > 8 * 1024 * 1024) return 'this drop is large. the tab may feel slow while it writes into postgres. it is not refused.';
  if (size > 1.5 * 1024 * 1024) return 'a heavier file. writing the bytes into the database can take a moment. nothing is capped.';
  return '';
}

async function insertRow(row) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/pressmarks`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(row),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`pressmark insert failed: ${r.status} ${text}`);
  }
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function getRow(id, withPayload) {
  const cols = withPayload
    ? 'id,name,mime,size,author,note,sha256,payload,created_at'
    : 'id,name,mime,size,author,note,sha256,created_at';
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/pressmarks?id=eq.${encodeURIComponent(id)}&select=${cols}&limit=1`,
    { headers: sbHeaders() },
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function listRows() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/pressmarks?select=id,name,mime,size,author,note,sha256,created_at&order=created_at.desc&limit=24`,
    { headers: sbHeaders() },
  );
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const q = req.query || {};
  if (req.method === 'GET') {
    if (String(q.list || '') === '1') {
      const rows = await listRows();
      res.status(200).json({ ok: true, rows });
      return;
    }
    const id = String(q.id || '');
    if (!id) {
      res.status(400).json({ error: 'missing id' });
      return;
    }
    const raw = String(q.raw || '') === '1';
    const row = await getRow(id, raw);
    if (!row) {
      res.status(404).json({ error: 'pressmark not found' });
      return;
    }
    if (raw) {
      const bytes = Buffer.from(row.payload || '', 'base64');
      res.setHeader('Content-Type', row.mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${String(row.name || 'file').replace(/"/g, '')}"`);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.status(200).send(bytes);
      return;
    }
    res.status(200).json({
      ok: true,
      row,
      filePath: `/api/pressmark?id=${encodeURIComponent(id)}&raw=1`,
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const buf = await readBody(req);
  const type = req.headers['content-type'] || '';
  let fileBuf = null;
  let name = 'file';
  let mime = 'application/octet-stream';
  let author = '';
  let note = '';

  if (type.includes('multipart/form-data')) {
    const parts = parseMultipart(buf, type);
    const file = parts.find((p) => p.filename || p.name === 'file');
    if (!file) {
      res.status(400).json({ error: 'no file in the form' });
      return;
    }
    fileBuf = file.body;
    name = file.filename || 'file';
    mime = file.type || mime;
    author = parts.find((p) => p.name === 'author')?.body?.toString('utf8') || '';
    note = parts.find((p) => p.name === 'note')?.body?.toString('utf8') || '';
  } else {
    let json = {};
    try {
      json = JSON.parse(buf.toString('utf8') || '{}');
    } catch {
      json = {};
    }
    const dataUrl = String(json.dataUrl || json.payload || '');
    const comma = dataUrl.indexOf(',');
    if (comma === -1) {
      res.status(400).json({ error: 'send a file field or a data url' });
      return;
    }
    fileBuf = Buffer.from(dataUrl.slice(comma + 1), 'base64');
    name = json.name || 'file';
    mime = json.mime || json.type || mime;
    author = json.author || '';
    note = json.note || '';
  }

  const id = uid();
  const sha256 = createHash('sha256').update(fileBuf).digest('hex');
  const warn = warnFor(fileBuf.length);
  const row = await insertRow({
    id,
    name: String(name).slice(0, 240),
    mime,
    size: fileBuf.length,
    author: String(author).slice(0, 80),
    note: String(note).slice(0, 400),
    sha256,
    payload: fileBuf.toString('base64'),
  });

  res.status(200).json({
    ok: true,
    id: row?.id || id,
    name,
    size: fileBuf.length,
    sha256,
    warn,
    sharePath: `/inlay/${id}`,
    filePath: `/api/pressmark?id=${encodeURIComponent(id)}&raw=1`,
  });
}
