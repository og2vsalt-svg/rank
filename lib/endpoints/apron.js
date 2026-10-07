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

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  const path = `apron/${id}/${safe}`;
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#0A84FF"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(img)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}"></head><body><p><a href="${esc(url)}">${esc(title)}</a></p></body></html>`;
}

async function getRow(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/apron_drops?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
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
        const list = await fetch(`${SUPABASE_URL}/rest/v1/apron_drops?select=id,for_name,note,file_name,mime,size,author,created_at&order=created_at.desc&limit=16`, { headers: headers() });
        const rows = list.ok ? await list.json() : [];
        res.status(200).json({ ok: true, drops: Array.isArray(rows) ? rows : [] });
        return;
      }
      const row = await getRow(id);
      const dest = `${proto}://${host}/apron/${encodeURIComponent(id)}`;
      if (isBot(ua) || req.query.embed === '1') {
        const title = row ? `${row.for_name} — ${row.file_name}` : 'apron — rankvault';
        const desc = row ? `${row.note || 'left on the apron'} · ${prettySize(row.size)}. large drops are warned, never refused.` : 'a file left for someone, with a folded note. not a cabinet.';
        const image = row && /^image\//.test(row.mime || '') ? row.file_url : undefined;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        res.status(200).send(cardHtml({ title, desc, url: dest, image }));
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'apron drop not found' });
        return;
      }
      res.status(200).json({ ok: true, ...row, warn: Number(row.size) > 12 * 1024 * 1024 ? 'large drop. preview clients may feel slow.' : null });
      return;
    }
    if (req.method === 'POST') {
      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const dataUrl = String(body.dataUrl || '');
      const comma = dataUrl.indexOf(',');
      if (!dataUrl.startsWith('data:') || comma < 0) {
        res.status(400).json({ error: 'send the local file as dataUrl' });
        return;
      }
      const buf = Buffer.from(dataUrl.slice(comma + 1), 'base64');
      const name = String(body.name || 'file').slice(0, 180);
      const type = String(body.type || 'application/octet-stream').slice(0, 120);
      const forName = String(body.forName || '').trim().slice(0, 80);
      const author = String(body.author || '').trim().slice(0, 40) || null;
      const note = String(body.note || '').trim().slice(0, 280) || null;
      if (!forName) {
        res.status(400).json({ error: 'who is this for?' });
        return;
      }
      const id = uid();
      const warn = buf.length > 12 * 1024 * 1024 ? 'large drop. it will not be refused. preview clients may feel slow.' : null;
      const fileUrl = await storeFile(id, name, type, buf);
      const share = {
        id,
        name,
        mime: type,
        size: buf.length,
        file_url: fileUrl,
        is_public: true,
        author,
        caption: note,
        download_count: 0,
        meta: { kind: 'apron', forName, warn, source: 'apron' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, { method: 'POST', headers: headers(), body: JSON.stringify(share) });
      const row = {
        id,
        for_name: forName,
        note,
        file_name: name,
        mime: type,
        size: buf.length,
        file_url: fileUrl,
        author,
      };
      const saved = await fetch(`${SUPABASE_URL}/rest/v1/apron_drops`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!saved.ok) {
        res.status(502).json({ error: 'file landed in storage, but the apron row failed', detail: (await saved.text()).slice(0, 240), warn });
        return;
      }
      res.status(200).json({ ok: true, id, url: fileUrl, sharePath: `/apron/${id}`, warn });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'apron failed' });
  }
}
