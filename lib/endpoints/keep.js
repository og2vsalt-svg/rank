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

function sbHeaders(extra) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
}

function originOf(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

async function sb(path, init) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, init);
  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!r.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`db ${r.status} ${detail.slice(0, 280)}`);
  }
  return data;
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
        const rows = await sb('hosted_files?select=id,name,mime,size,caption,author,accent,download_count,created_at&order=created_at.desc&limit=24', {
          headers: sbHeaders(),
        });
        res.status(200).json({ ok: true, files: Array.isArray(rows) ? rows : [] });
        return;
      }
      const id = String(req.query.id || '').trim();
      if (!id) {
        res.status(400).json({ error: 'missing id' });
        return;
      }
      const files = await sb(`hosted_files?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: sbHeaders() });
      const file = Array.isArray(files) ? files[0] : null;
      if (!file) {
        res.status(404).json({ error: 'file not found' });
        return;
      }
      if (req.query.dl === '1') {
        const chunks = await sb(`file_chunks?file_id=eq.${encodeURIComponent(id)}&select=idx,payload&order=idx.asc`, {
          headers: sbHeaders(),
        });
        if (!Array.isArray(chunks) || !chunks.length) {
          res.status(409).json({ error: 'file is still arriving' });
          return;
        }
        const buf = Buffer.concat(chunks.map((c) => Buffer.from(c.payload, 'base64')));
        const next = (Number(file.download_count) || 0) + 1;
        sb(`hosted_files?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: sbHeaders(),
          body: JSON.stringify({ download_count: next }),
        }).catch(() => {});
        res.setHeader('Content-Type', file.mime || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${String(file.name).replace(/"/g, '')}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).send(buf);
        return;
      }
      res.status(200).json({
        ok: true,
        id: file.id,
        name: file.name,
        type: file.mime,
        size: Number(file.size) || 0,
        caption: file.caption,
        author: file.author,
        downloads: Number(file.download_count) || 0,
        sharePath: `/s/${file.id}`,
        url: `${originOf(req)}/api/keep?id=${encodeURIComponent(file.id)}&dl=1`,
      });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const action = String(body.action || 'open');

    if (action === 'open') {
      const id = String(body.id || uid()).slice(0, 64);
      const name = String(body.name || 'file').slice(0, 512);
      const type = String(body.type || 'application/octet-stream').slice(0, 180);
      const size = Number(body.size) || 0;
      const caption = body.caption ? String(body.caption).slice(0, 280) : null;
      const author = body.author ? String(body.author).slice(0, 80) : null;
      const accent = /^#[0-9a-fA-F]{6}$/.test(body.accent || '') ? body.accent : '#0A84FF';
      const warn = size > 8 * 1024 * 1024 ? 'large drop. the tab may feel slow while it walks the pieces in. nothing is refused.' : null;
      await sb('hosted_files', {
        method: 'POST',
        headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify({ id, name, mime: type, size, caption, author, accent }),
      });
      const fileUrl = `${originOf(req)}/api/keep?id=${encodeURIComponent(id)}&dl=1`;
      await sb('public_shares?on_conflict=id', {
        method: 'POST',
        headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify({
          id,
          name,
          mime: type,
          size,
          file_url: fileUrl,
          is_public: true,
          author,
          caption,
          meta: { source: 'keep', accent, warn },
          updated_at: new Date().toISOString(),
        }),
      });
      res.status(200).json({ ok: true, id, sharePath: `/s/${id}`, embedPath: `/s/${id}`, warn });
      return;
    }

    if (action === 'chunk') {
      const id = String(body.id || '').slice(0, 64);
      const idx = Number(body.idx);
      const payload = String(body.payload || '');
      if (!id || !Number.isInteger(idx) || idx < 0 || !payload) {
        res.status(400).json({ error: 'id, idx, and payload required' });
        return;
      }
      await sb('file_chunks?on_conflict=file_id,idx', {
        method: 'POST',
        headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify({ file_id: id, idx, payload }),
      });
      res.status(200).json({ ok: true, id, idx });
      return;
    }

    if (action === 'pin') {
      const url = String(body.url || '').slice(0, 2000);
      const note = body.note ? String(body.note).slice(0, 280) : null;
      const author = body.author ? String(body.author).slice(0, 80) : null;
      if (!url) {
        res.status(400).json({ error: 'url required' });
        return;
      }
      const rows = await sb('links', {
        method: 'POST',
        headers: sbHeaders(),
        body: JSON.stringify({ url, note, author }),
      });
      res.status(200).json({ ok: true, link: Array.isArray(rows) ? rows[0] : rows });
      return;
    }

    if (action === 'pins') {
      const rows = await sb('links?select=id,url,note,author,created_at&order=created_at.desc&limit=30', {
        headers: sbHeaders(),
      });
      res.status(200).json({ ok: true, links: Array.isArray(rows) ? rows : [] });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'keep failed' });
  }
}
