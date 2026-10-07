const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const SLOW = 12 * 1024 * 1024;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function headers(prefer) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    Prefer: prefer || 'return=representation',
  };
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function cleanName(name) {
  return String(name || 'file').replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180) || 'file';
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
    res.statusCode = 204;
    res.end();
    return;
  }
  try {
    if (req.method === 'GET') {
      const id = req.query && req.query.id;
      if (id) {
        const r = await fetch(SUPABASE_URL + '/rest/v1/dossiers?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1', { headers: headers() });
        const rows = await r.json();
        const row = Array.isArray(rows) ? rows[0] : null;
        res.statusCode = row ? 200 : 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(row ? { ok: true, ...row } : { ok: false, error: 'dossier not found' }));
        return;
      }
      const r = await fetch(SUPABASE_URL + '/rest/v1/dossiers?select=id,title,caption,name,mime,size,file_url,author,created_at&order=created_at.desc&limit=24', { headers: headers() });
      const rows = await r.json();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, dossiers: Array.isArray(rows) ? rows : [] }));
      return;
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      const title = String(body.title || '').trim().slice(0, 160);
      const name = String(body.name || '').trim().slice(0, 512);
      const dataUrl = String(body.dataUrl || '');
      if (!title || !name || !dataUrl.startsWith('data:')) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'title, file name, and file are required' }));
        return;
      }
      const comma = dataUrl.indexOf(',');
      const meta = dataUrl.slice(5, comma);
      const mime = (body.mime || meta.split(';')[0] || 'application/octet-stream').slice(0, 180);
      const bytes = Buffer.from(dataUrl.slice(comma + 1), 'base64');
      const id = uid();
      const path = id + '/' + cleanName(name);
      const up = await fetch(SUPABASE_URL + '/storage/v1/object/dossiers/' + path.split('/').map(encodeURIComponent).join('/'), {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + SUPABASE_KEY,
          'Content-Type': mime,
          'x-upsert': 'true',
        },
        body: bytes,
      });
      if (!up.ok) {
        const detail = await up.text();
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'storage did not take the file', detail: detail.slice(0, 240) }));
        return;
      }
      const fileUrl = SUPABASE_URL + '/storage/v1/object/public/dossiers/' + path.split('/').map(encodeURIComponent).join('/');
      const row = {
        id,
        title,
        caption: String(body.caption || '').slice(0, 400) || null,
        name,
        mime,
        size: bytes.length,
        file_url: fileUrl,
        author: String(body.author || '').slice(0, 80) || null,
      };
      const ins = await fetch(SUPABASE_URL + '/rest/v1/dossiers', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!ins.ok) {
        const detail = await ins.text();
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'the row did not save', detail: detail.slice(0, 240) }));
        return;
      }
      const saved = await ins.json();
      const warn = bytes.length > SLOW ? 'this dossier is heavy. it may open slowly. it was still filed.' : null;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, ...(Array.isArray(saved) ? saved[0] : row), warn }));
      return;
    }

    res.statusCode = 405;
    res.end('method not allowed');
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err && err.message ? err.message : 'dossier desk failed' }));
  }
}
