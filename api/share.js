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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object' && !req.readable) return Buffer.from(JSON.stringify(req.body));
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
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

async function sbListShares(limit) {
  const n = Math.min(40, Math.max(1, Number(limit) || 16));
  const url = `${SUPABASE_URL}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,file_url,expires_at,author,download_count,caption,created_at&order=created_at.desc&limit=${n}`;
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) return [];
  const rows = await r.json();
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => !row.expires_at || +new Date(row.expires_at) > Date.now());
}

async function sbUpsertShare(row) {
  const url = `${SUPABASE_URL}/rest/v1/public_shares?on_conflict=id`;
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
    caption: row.caption || (row.meta && row.meta.caption) || null,
    meta: row.meta || {},
  };
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
    const next = buf.indexOf(boundary, start);
    if (next === -1) break;
    let chunk = buf.slice(start, next - 2);
    const sep = chunk.indexOf('\r\n\r\n');
    if (sep !== -1) {
      const head = chunk.slice(0, sep).toString('utf8');
      const body = chunk.slice(sep + 4);
      const name = /name="([^"]+)"/.exec(head)?.[1] || '';
      const filename = /filename="([^"]*)"/.exec(head)?.[1] || '';
      const type = /Content-Type:\s*([^\r\n]+)/i.exec(head)?.[1] || 'application/octet-stream';
      parts.push({ name, filename, type, body });
    }
    start = next;
  }
  return parts;
}

async function storeBytes({ id, name, type, buf }) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'file';
  const objectPath = `${id}/${safeName}`;
  let fileUrl = null;
  let storageError = '';
  try {
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
    if (up.ok) fileUrl = `${SUPABASE_URL}/storage/v1/object/public/shares/${objectPath}`;
    else storageError = await up.text();
  } catch (err) {
    storageError = err?.message || 'storage request failed';
  }
  if (!fileUrl) {
    const opts = blobOpts();
    if (opts) {
      const fileBlob = await put(`shares/${id}/${safeName}`, buf, {
        access: 'public',
        contentType: type,
        addRandomSuffix: false,
        allowOverwrite: true,
        ...opts,
      });
      fileUrl = fileBlob.url;
    }
  }
  return { fileUrl, storageError };
}

function shareResponse(res, { id, fileUrl, warn }) {
  res.status(200).json({
    ok: true,
    id,
    url: fileUrl,
    sharePath: `/s/${id}`,
    embedPath: `/s/${id}`,
    warn,
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      if (req.query.list === '1') {
        const rows = await sbListShares(req.query.limit);
        res.status(200).json({ ok: true, shares: rows.map(rowToMeta) });
        return;
      }
      const id = (req.query.id || '').toString().trim();
      if (!id) {
        res.status(400).json({ error: 'missing id' });
        return;
      }
      const row = await sbGetShare(id);
      if (!row || !row.is_public) {
        res.status(404).json({ error: 'share not found' });
        return;
      }
      if (row.expires_at && +new Date(row.expires_at) < Date.now()) {
        res.status(410).json({ error: 'share expired' });
        return;
      }
      const meta = rowToMeta(row);
      if (req.query.dl === '1') sbBumpDownload(id, (Number(row.download_count) || 0) + 1);
      res.status(200).json(meta);
      return;
    }

    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      const raw = await readBody(req);
      let id = uid();
      let name = 'file';
      let type = 'application/octet-stream';
      let buf = null;
      let lockPass = null;
      let expiresAt = null;
      let author = null;
      let caption = null;
      let color = null;
      let cardTitle = null;
      let hostedUrl = null;
      let declaredSize = null;

      if (contentType.includes('multipart/form-data')) {
        const parts = parseMultipart(raw, contentType) || [];
        const file = parts.find((p) => p.filename || p.name === 'file');
        if (!file) {
          res.status(400).json({ error: 'file field required' });
          return;
        }
        buf = file.body;
        name = file.filename || 'file';
        type = file.type || 'application/octet-stream';
        const field = (key) => parts.find((p) => p.name === key)?.body.toString('utf8') || '';
        id = (field('id') || id).toString().slice(0, 64);
        author = field('author') || null;
        caption = field('caption') || null;
        lockPass = field('lockPass') || null;
        expiresAt = field('expiresAt') || null;
        color = field('color') || null;
        cardTitle = field('cardTitle') || null;
      } else if (contentType.includes('application/json') || (req.body && typeof req.body === 'object')) {
        const body = contentType.includes('application/json') ? JSON.parse(raw.toString('utf8') || '{}') : req.body;
        id = (body.id || id).toString().slice(0, 64);
        name = (body.name || 'file').toString().slice(0, 512);
        type = (body.type || 'application/octet-stream').toString();
        author = body.author || null;
        caption = body.caption || null;
        lockPass = body.lockPass || null;
        expiresAt = body.expiresAt || null;
        color = body.color || null;
        cardTitle = body.cardTitle || null;
        declaredSize = Number(body.size);
        if (typeof body.fileUrl === 'string' && /^https?:\/\//i.test(body.fileUrl)) {
          hostedUrl = body.fileUrl.slice(0, 2000);
        } else {
          const dataUrl = body.dataUrl;
          if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
            res.status(400).json({ error: 'dataUrl or fileUrl required' });
            return;
          }
          const comma = dataUrl.indexOf(',');
          if (comma < 0) {
            res.status(400).json({ error: 'bad dataUrl' });
            return;
          }
          buf = Buffer.from(dataUrl.slice(comma + 1), 'base64');
        }
      } else {
        res.status(400).json({ error: 'send a file or json dataUrl' });
        return;
      }

      const storedName = name || 'file';
      name = (cardTitle || name).toString().slice(0, 512);
      const size = hostedUrl ? (Number.isFinite(declaredSize) ? declaredSize : 0) : buf.length;
      const warn = size > 12 * 1024 * 1024 ? 'large drop. preview clients may feel slow.' : null;
      let fileUrl = hostedUrl;
      let storageError = '';
      if (!fileUrl) {
        const stored = await storeBytes({ id, name: storedName, type, buf });
        fileUrl = stored.fileUrl;
        storageError = stored.storageError;
        if (!fileUrl && size <= 900 * 1024) {
          fileUrl = `data:${type};base64,${buf.toString('base64')}`;
        }
      }
      if (!fileUrl) {
        res.status(502).json({
          error: 'storage did not take the file. the row was not written with a data url.',
          detail: (storageError || '').slice(0, 240),
          warn,
        });
        return;
      }

      const row = {
        id,
        name,
        mime: type,
        size,
        file_url: fileUrl,
        lock_pass: lockPass,
        expires_at: expiresAt,
        is_public: true,
        download_count: 0,
        author,
        caption,
        meta: {
          warn,
          source: hostedUrl ? 'fid' : 'rankvault',
          caption,
          color: /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : null,
          cardTitle: cardTitle ? String(cardTitle).slice(0, 120) : null,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await sbUpsertShare(row);
      shareResponse(res, { id, fileUrl, warn });
      return;
    }

    if (req.method === 'PATCH') {
      const raw = await readBody(req);
      let body;
      try {
        body = JSON.parse(raw.toString('utf8') || '{}');
      } catch {
        res.status(400).json({ error: 'bad json' });
        return;
      }
      const id = (body.id || '').toString().trim().slice(0, 64);
      if (!id) {
        res.status(400).json({ error: 'id required' });
        return;
      }
      const row = await sbGetShare(id);
      if (!row) {
        res.status(404).json({ error: 'share not found' });
        return;
      }
      const meta = { ...(row.meta || {}) };
      if (body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)) Object.assign(meta, body.meta);
      if (typeof body.caption === 'string') meta.caption = body.caption.slice(0, 280);
      if (typeof body.cardTitle === 'string' && body.cardTitle.trim()) meta.cardTitle = body.cardTitle.slice(0, 120);
      if (typeof body.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.color)) meta.color = body.color;
      await sbUpsertShare({ ...row, meta, caption: meta.caption || row.caption || null, updated_at: new Date().toISOString() });
      res.status(200).json({ ok: true, id, embedPath: `/s/${id}` });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'share failed' });
  }
}
