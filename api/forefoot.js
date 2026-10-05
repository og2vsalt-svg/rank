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
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
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

function cardHtml({ title, desc, url }) {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#0A84FF" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(OG)}" /><meta property="og:image:secure_url" content="${esc(OG)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(OG)}" /></head><body style="margin:0;background:#070709;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.14em;text-transform:uppercase;font-size:12px">rankvault · forefoot</p><h1 style="letter-spacing:-.04em;font-weight:600">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '4mb' },
  },
};

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

  try {
    if (req.method === 'GET' && (q.list === '1' || q.list === 'true')) {
      const rows = await sb('forefoot_drops?select=id,name,mime,size,note,author,chunk_count,created_at&order=created_at.desc&limit=24');
      send(res, 200, { drops: Array.isArray(rows) ? rows : [] });
      return;
    }

    if (req.method === 'GET' && q.id && (q.download === '1' || q.file === '1')) {
      const id = String(q.id).slice(0, 64);
      const metaRows = await sb(`forefoot_drops?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size&limit=1`);
      const meta = Array.isArray(metaRows) ? metaRows[0] : null;
      if (!meta) return send(res, 404, { error: 'drop not found' });
      const chunks = await sb(`forefoot_chunks?drop_id=eq.${encodeURIComponent(id)}&select=idx,payload&order=idx.asc`);
      const parts = (Array.isArray(chunks) ? chunks : []).map((c) => Buffer.from(c.payload || '', 'base64'));
      const buf = Buffer.concat(parts);
      const name = String(meta.name || 'file').replace(/[\r\n"]/g, '');
      send(res, 200, buf, {
        type: meta.mime || 'application/octet-stream',
        disp: `inline; filename="${name}"`,
      });
      return;
    }

    if (req.method === 'GET' && q.id) {
      const id = String(q.id).slice(0, 64);
      const rows = await sb(`forefoot_drops?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,note,author,chunk_count,created_at&limit=1`);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) return send(res, 404, { error: 'drop not found' });
      const page = q.page === 'swifter' ? 'swifter' : 'forefoot';
      const url = `${SITE}/${page}/${encodeURIComponent(row.id)}`;
      if (bot || q.card === '1') {
        const title = row.name || 'forefoot drop';
        const desc = `${pretty(row.size)} stored in the database${row.note ? ' · ' + row.note : ''}. open on rankvault.`;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.end(cardHtml({ title, desc, url }));
        return;
      }
      send(res, 200, { drop: row, url, file: `${SITE}/api/forefoot?id=${encodeURIComponent(row.id)}&download=1` });
      return;
    }

    if (req.method === 'GET') {
      const url = `${SITE}/forefoot`;
      if (bot || q.card === '1') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(cardHtml({
          title: 'forefoot — file bytes in the database',
          desc: 'a local file, stored in pieces on rankvault. no size cutoff, only a note when the tab will feel slow.',
          url,
        }));
        return;
      }
      send(res, 200, { ok: true, desk: 'forefoot' });
      return;
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });

    const body = await readBody(req);
    const action = String(body.action || '');

    if (action === 'open') {
      const id = String(body.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
      if (id.length < 4) return send(res, 400, { error: 'id missing' });
      const name = String(body.name || 'untitled').slice(0, 512);
      const row = {
        id,
        name,
        mime: String(body.mime || 'application/octet-stream').slice(0, 180),
        size: Math.max(0, Number(body.size) || 0),
        note: body.note ? String(body.note).slice(0, 280) : null,
        author: body.author ? String(body.author).slice(0, 80) : 'forefoot',
        chunk_count: 0,
      };
      const saved = await sb('forefoot_drops?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(row),
      });
      send(res, 200, { drop: Array.isArray(saved) ? saved[0] : saved });
      return;
    }

    if (action === 'chunk') {
      const id = String(body.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
      const idx = Number(body.idx);
      const payload = String(body.payload || '');
      if (!id || !Number.isFinite(idx) || idx < 0 || !payload) return send(res, 400, { error: 'chunk incomplete' });
      await sb('forefoot_chunks?on_conflict=drop_id,idx', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ drop_id: id, idx, payload }),
      });
      send(res, 200, { ok: true, idx });
      return;
    }

    if (action === 'seal') {
      const id = String(body.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
      const chunkCount = Math.max(0, Number(body.chunkCount) || 0);
      await sb(`forefoot_drops?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ chunk_count: chunkCount }),
      });
      const url = `${SITE}/forefoot/${encodeURIComponent(id)}`;
      send(res, 200, {
        ok: true,
        id,
        url,
        swifter: `${SITE}/swifter/${encodeURIComponent(id)}`,
        file: `${SITE}/api/forefoot?id=${encodeURIComponent(id)}&download=1`,
      });
      return;
    }

    send(res, 400, { error: 'unknown action' });
  } catch (err) {
    send(res, 500, { error: err instanceof Error ? err.message : 'forefoot failed' });
  }
};
