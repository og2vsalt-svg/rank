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

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
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
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) return null;
  const boundary = Buffer.from('--' + (m[1] || m[2]).trim());
  const parts = [];
  let start = buf.indexOf(boundary);
  while (start !== -1) {
    start += boundary.length;
    if (buf.slice(start, start + 2).toString() === '--') break;
    if (buf.slice(start, start + 2).toString() === '\r\n') start += 2;
    const end = buf.indexOf(boundary, start);
    if (end === -1) break;
    let block = buf.slice(start, end - 2);
    const sep = block.indexOf('\r\n\r\n');
    if (sep !== -1) {
      const head = block.slice(0, sep).toString();
      const body = block.slice(sep + 4);
      const name = /name="([^"]+)"/.exec(head);
      const filename = /filename="([^"]*)"/.exec(head);
      const type = /Content-Type:\s*([^\r\n]+)/i.exec(head);
      parts.push({
        name: name ? name[1] : '',
        filename: filename ? filename[1] : '',
        type: type ? type[1].trim() : '',
        body,
      });
    }
    start = end;
  }
  return parts;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const id = (req.query.id || '').toString().trim();
    if (!id) {
      res.status(400).json({ error: 'missing id' });
      return;
    }
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/quay_files?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,author,caption,accent,payload,created_at&limit=1`,
      { headers: sbHeaders() },
    );
    if (!r.ok) {
      res.status(502).json({ error: 'quay table unread' });
      return;
    }
    const rows = await r.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      res.status(404).json({ error: 'not on the hawsepipe' });
      return;
    }
    if (req.query.raw === '1' && row.payload) {
      const bytes = Buffer.from(row.payload, 'base64');
      res.setHeader('Content-Type', row.mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${(row.name || 'file').replace(/"/g, '')}"`);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.status(200).send(bytes);
      return;
    }
    res.status(200).json({
      id: row.id,
      name: row.name,
      mime: row.mime,
      size: Number(row.size) || 0,
      author: row.author,
      caption: row.caption,
      accent: row.accent,
      createdAt: row.created_at,
      raw: `/api/quay?id=${encodeURIComponent(row.id)}&raw=1`,
      card: `/s/${row.id}`,
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'use POST' });
    return;
  }

  const buf = await readBody(req);
  const parts = parseMultipart(buf, req.headers['content-type'] || '');
  if (!parts) {
    res.status(400).json({ error: 'send multipart with a file field' });
    return;
  }
  const file = parts.find((p) => p.name === 'file' && p.body && p.body.length);
  if (!file) {
    res.status(400).json({ error: 'no file field' });
    return;
  }
  const field = (name) => {
    const hit = parts.find((p) => p.name === name && !p.filename);
    return hit ? hit.body.toString('utf8').slice(0, 400) : '';
  };
  const id = uid();
  const name = (file.filename || 'untitled').slice(0, 180);
  const mime = file.type || 'application/octet-stream';
  const caption = field('caption');
  const author = field('author') || 'hawsepipe';
  const accent = /^#[0-9a-fA-F]{6}$/.test(field('accent')) ? field('accent') : '#0A84FF';
  const payload = file.body.toString('base64');
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const origin = host ? `${proto}://${host}` : '';
  const fileUrl = origin ? `${origin}/api/quay?id=${encodeURIComponent(id)}&raw=1` : `/api/quay?id=${id}&raw=1`;

  const insert = await fetch(`${SUPABASE_URL}/rest/v1/quay_files`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({
      id,
      name,
      mime,
      size: file.body.length,
      author,
      caption,
      accent,
      payload,
    }),
  });
  if (!insert.ok) {
    const text = await insert.text();
    res.status(502).json({ error: 'quay insert failed', detail: text.slice(0, 240) });
    return;
  }

  await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({
      id,
      name,
      mime,
      size: file.body.length,
      file_url: fileUrl,
      is_public: true,
      author,
      caption,
      meta: { color: accent, cardTitle: name, via: 'hawsepipe' },
    }),
  });

  res.status(200).json({
    id,
    name,
    size: file.body.length,
    warned: file.body.length > 3_500_000,
    card: `/s/${id}`,
    page: `/hawsepipe/${id}`,
    raw: fileUrl,
  });
}
