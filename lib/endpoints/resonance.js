const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|embedly|discordbot/i.test(ua || '');
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
  if (req.body && typeof req.body === 'object' && !req.readable) return Buffer.from(JSON.stringify(req.body));
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function storeFile(id, name, type, buf) {
  const safe = String(name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 140) || 'file';
  const path = `resonance/${id}/${safe}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/shares/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': type || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!up.ok) {
    const detail = await up.text();
    throw new Error(detail.slice(0, 240) || 'storage did not take the file');
  }
  return `${SUPABASE_URL}/storage/v1/object/public/shares/${path}`;
}

function cardHtml({ title, desc, url, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><meta name="description" content="${desc}"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${url}"><meta property="og:image" content="${img}"><meta name="twitter:card" content="summary_large_image"></head><body><a href="${url}">${title}</a></body></html>`;
}

async function getRow(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : null;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = req.headers['user-agent'] || '';
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim();
      if (!id) {
        const list = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?meta->>kind=eq.resonance&select=id,name,caption,size,author,created_at&order=created_at.desc&limit=16`, { headers: headers() });
        const rows = list.ok ? await list.json() : [];
        res.status(200).json({ ok: true, shares: Array.isArray(rows) ? rows : [] });
        return;
      }
      const row = await getRow(id);
      const dest = `${proto}://${host}/resonance/${encodeURIComponent(id)}`;
      if (isBot(ua) || req.query.embed === '1') {
        const title = row ? (row.caption ? `${row.name} — ${row.caption.slice(0, 60)}` : row.name) : 'resonance — rankvault';
        const desc = row ? `${row.caption || 'a resonant share'} · ${prettySize(row.size)}. large files are warned, never refused.` : 'a shared note or file that resonates. not a vault.';
        const image = row && /^image\//.test(row.mime || '') ? row.file_url : undefined;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        res.status(200).send(cardHtml({ title, desc, url: dest, image }));
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'share not found' });
        return;
      }
      res.status(200).json({ ok: true, ...row, warn: Number(row.size) > 12 * 1024 * 1024 ? 'large file. preview clients may feel slow.' : null });
      return;
    }
    if (req.method === 'POST') {
      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const hasFile = !!body.dataUrl;
      let fileUrl = null;
      let size = 0;
      let mime = null;
      let name = String(body.title || 'resonance').trim().slice(0, 80);
      if (hasFile) {
        const dataUrl = String(body.dataUrl || '');
        const comma = dataUrl.indexOf(',');
        if (!dataUrl.startsWith('data:') || comma < 0) {
          res.status(400).json({ error: 'send the local file as dataUrl' });
          return;
        }
        const buf = Buffer.from(dataUrl.slice(comma + 1), 'base64');
        name = String(body.name || name).slice(0, 180);
        mime = String(body.type || 'application/octet-stream').slice(0, 120);
        size = buf.length;
        fileUrl = await storeFile(uid(), name, mime, buf);
      }
      const caption = String(body.caption || '').trim().slice(0, 400) || null;
      const author = String(body.author || '').trim().slice(0, 40) || null;
      const id = uid();
      const warn = size > 12 * 1024 * 1024 ? 'large file. it will not be refused. preview clients may feel slow.' : null;
      const share = {
        id,
        name,
        mime,
        size,
        file_url: fileUrl,
        is_public: true,
        author,
        caption,
        download_count: 0,
        meta: { kind: 'resonance', warn, source: 'resonance' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const saved = await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, { method: 'POST', headers: headers(), body: JSON.stringify(share) });
      if (!saved.ok) {
        const detail = await saved.text();
        res.status(502).json({ error: 'share row failed', detail: detail.slice(0, 240), warn });
        return;
      }
      res.status(200).json({ ok: true, id, url: fileUrl, sharePath: `/resonance/${id}`, warn });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'resonance failed' });
  }
}
