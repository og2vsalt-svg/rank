const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const SITE = 'https://rank-six-iota.vercel.app';
const OG = 'https://og2vsalt-svg.github.io/rank/og.png';

function headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
}

function esc(s) {
  const amp = String.fromCharCode(38);
  return String(s || '')
    .replace(/&/g, amp + 'amp;')
    .replace(/</g, amp + 'lt;')
    .replace(/>/g, amp + 'gt;')
    .replace(/"/g, amp + 'quot;');
}

function pretty(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function send(res, code, body, extra = {}) {
  res.statusCode = code;
  const isObj = body && typeof body === 'object' && !Buffer.isBuffer(body);
  res.setHeader('Content-Type', extra.type || (isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8'));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (extra.disp) res.setHeader('Content-Disposition', extra.disp);
  res.end(isObj ? JSON.stringify(body) : body);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

async function sb(path, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers || {}) },
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) {
    const msg = typeof data === 'string' ? data : data?.message || data?.error || text || r.statusText;
    throw new Error(msg || `supabase ${r.status}`);
  }
  return data;
}

function card(res, { title, desc, url, image }) {
  const t = esc(title);
  const d = esc(desc);
  const u = esc(url);
  const img = esc(image || OG);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>${t}</title>
<meta name="description" content="${d}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="rankvault" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${u}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${img}" />
<meta http-equiv="refresh" content="0;url=${u}" />
</head><body><p><a href="${u}">${t}</a></p></body></html>`);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  const q = req.query || {};
  const ua = String(req.headers['user-agent'] || '');
  const bot = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely/i.test(ua);
  const page = String(q.page || 'chock');

  try {
    if (req.method === 'GET' && (q.list === '1' || q.list === 'true' || (page === 'kelson' && !q.id))) {
      const files = await sb('garboard_files?select=id,name,mime,size,caption,author,chunk_count,created_at&order=created_at.desc&limit=24');
      if ((bot || q.card === '1') && !q.id) {
        if (page === 'kelson') {
          return card(res, {
            title: 'rankvault kelson',
            desc: 'receipts for files stored in the database. not another vault.',
            url: `${SITE}/kelson`,
          });
        }
        if (page === 'mizzen') {
          return card(res, {
            title: 'rankvault mizzen',
            desc: 'a reading shelf for files already stored. preview, caption, copy the link.',
            url: `${SITE}/mizzen`,
          });
        }
        return card(res, {
          title: 'rankvault chock',
          desc: 'store a local file in the database. large files are warned, never refused.',
          url: `${SITE}/chock`,
        });
      }
      return send(res, 200, { files: Array.isArray(files) ? files : [] });
    }

    if (req.method === 'GET' && q.id && (q.download === '1' || q.file === '1')) {
      const id = String(q.id).slice(0, 64);
      const metaRows = await sb(`garboard_files?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size&limit=1`);
      const meta = Array.isArray(metaRows) ? metaRows[0] : null;
      if (!meta) return send(res, 404, { error: 'file not found' });
      const chunks = await sb(`garboard_chunks?file_id=eq.${encodeURIComponent(id)}&select=idx,payload&order=idx.asc`);
      const parts = (Array.isArray(chunks) ? chunks : []).map((c) => Buffer.from(c.payload || '', 'base64'));
      const buf = Buffer.concat(parts);
      const name = String(meta.name || 'file').replace(/[\r\n"]/g, '');
      return send(res, 200, buf, {
        type: meta.mime || 'application/octet-stream',
        disp: `inline; filename="${name}"`,
      });
    }

    if (req.method === 'GET' && q.id) {
      const id = String(q.id).slice(0, 64);
      const rows = await sb(`garboard_files?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,caption,author,chunk_count,created_at&limit=1`);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) return send(res, 404, { error: 'file not found' });
      const where = page === 'mizzen' ? 'mizzen' : 'chock';
      const url = `${SITE}/${where}/${encodeURIComponent(row.id)}`;
      if (bot || q.card === '1') {
        const image = /^image\//.test(row.mime || '') ? `${SITE}/api/chock?id=${encodeURIComponent(row.id)}&file=1` : OG;
        return card(res, {
          title: row.name || 'chock file',
          desc: `${pretty(row.size)} in the database${row.caption ? ' · ' + row.caption : ''}. open on rankvault.`,
          url,
          image,
        });
      }
      return send(res, 200, {
        ...row,
        url,
        fileUrl: `${SITE}/api/chock?id=${encodeURIComponent(row.id)}&file=1`,
      });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const action = String(body.action || 'open');
      const id = String(body.id || '').slice(0, 64);
      if (!/^[a-z0-9]{4,64}$/i.test(id)) return send(res, 400, { error: 'id needs 4–64 letters or numbers' });

      if (action === 'open') {
        const row = {
          id,
          name: String(body.name || 'untitled').slice(0, 512),
          mime: String(body.mime || 'application/octet-stream').slice(0, 180),
          size: Math.max(0, Number(body.size) || 0),
          caption: String(body.caption || '').slice(0, 280),
          author: String(body.author || 'chock').slice(0, 80),
          chunk_count: 0,
        };
        const saved = await sb('garboard_files', { method: 'POST', body: JSON.stringify(row) });
        return send(res, 200, { ok: true, file: Array.isArray(saved) ? saved[0] : saved });
      }

      if (action === 'chunk') {
        const idx = Number(body.idx);
        const payload = String(body.payload || '');
        if (!Number.isInteger(idx) || idx < 0) return send(res, 400, { error: 'bad piece index' });
        if (!payload) return send(res, 400, { error: 'empty piece' });
        await sb('garboard_chunks', { method: 'POST', body: JSON.stringify({ file_id: id, idx, payload }) });
        return send(res, 200, { ok: true, idx });
      }

      if (action === 'seal') {
        const chunkCount = Math.max(0, Number(body.chunkCount) || 0);
        await sb(`garboard_files?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ chunk_count: chunkCount }),
        });
        return send(res, 200, {
          ok: true,
          url: `${SITE}/chock/${encodeURIComponent(id)}`,
          reader: `${SITE}/mizzen/${encodeURIComponent(id)}`,
          fileUrl: `${SITE}/api/chock?id=${encodeURIComponent(id)}&file=1`,
        });
      }

      return send(res, 400, { error: 'unknown action' });
    }

    return send(res, 405, { error: 'method not allowed' });
  } catch (err) {
    return send(res, 500, { error: err?.message || 'chock failed' });
  }
}
