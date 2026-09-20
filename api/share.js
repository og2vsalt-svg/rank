import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function blobOpts() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token ? { token } : null;
}

function sbHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function sbGetShare(id) {
  const url = `${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=*&limit=1`;
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function sbUpsertShare(row) {
  const url = `${SUPABASE_URL}/rest/v1/public_shares`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      ...sbHeaders(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`supabase insert failed: ${r.status} ${text}`);
  }
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function sbBumpDownload(id, next) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: sbHeaders(),
      body: JSON.stringify({ download_count: next, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

function rowToMeta(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.mime || 'application/octet-stream',
    size: Number(row.size) || 0,
    url: row.file_url,
    lockPass: row.lock_pass || '',
    expiresAt: row.expires_at || null,
    createdAt: row.created_at,
    downloads: Number(row.download_count) || 0,
    author: row.author || null,
    meta: row.meta || {},
  };
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

      const row = await sbGetShare(id);
      if (!row) {
        res.status(404).json({ error: 'share not found' });
        return;
      }

      if (row.expires_at && +new Date(row.expires_at) < Date.now()) {
        res.status(410).json({ error: 'share expired' });
        return;
      }

      if (!row.is_public) {
        res.status(404).json({ error: 'share not found' });
        return;
      }

      const meta = rowToMeta(row);
      if (req.query.dl === '1') {
        sbBumpDownload(id, (Number(row.download_count) || 0) + 1);
      }

      res.status(200).json(meta);
      return;
    }

    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        res.status(400).json({ error: 'send json { id?, name, type, size, dataUrl, lockPass?, expiresAt?, author? }' });
        return;
      }

      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf8'));
      const id = (body.id || uid()).toString().slice(0, 64);
      const name = (body.name || 'file').toString().slice(0, 512);
      const type = (body.type || 'application/octet-stream').toString();
      const dataUrl = body.dataUrl;
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        res.status(400).json({ error: 'dataUrl required' });
        return;
      }

      const comma = dataUrl.indexOf(',');
      if (comma < 0) {
        res.status(400).json({ error: 'bad dataUrl' });
        return;
      }
      const b64 = dataUrl.slice(comma + 1);
      const buf = Buffer.from(b64, 'base64');
      const size = Number(body.size) || buf.length;

      let fileUrl = null;
      const opts = blobOpts();
      if (opts) {
        const fileBlob = await put(`shares/${id}/${name}`, buf, {
          access: 'public',
          contentType: type,
          addRandomSuffix: false,
          allowOverwrite: true,
          ...opts,
        });
        fileUrl = fileBlob.url;
      } else {
        fileUrl = dataUrl;
      }

      const warn = size > 40 * 1024 * 1024 ? 'large drop. preview clients may feel slow.' : null;

      const row = {
        id,
        name,
        mime: type,
        size,
        file_url: fileUrl,
        lock_pass: body.lockPass || null,
        expires_at: body.expiresAt || null,
        is_public: true,
        download_count: 0,
        author: body.author || null,
        meta: { warn, source: 'rankvault' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await sbUpsertShare(row);

      res.status(200).json({
        ok: true,
        id,
        url: fileUrl,
        sharePath: `/#share?f=${id}`,
        embedPath: `/s/${id}`,
        warn,
      });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'share failed' });
  }
}
