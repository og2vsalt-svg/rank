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
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
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
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|embedly|discordbot|preview|bot|crawler|spider/i.test(ua || '');
}
function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
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
  const path = `cartouche/${id}/${safe}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/shares/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': type || 'application/octet-stream', 'x-upsert': 'true' },
    body: buf,
  });
  if (!up.ok) return { url: null, detail: (await up.text()).slice(0, 180) };
  return { url: `${SUPABASE_URL}/storage/v1/object/public/shares/${path}` };
}
function cardHtml({ title, desc, url, image }) {
  const img = image && /^https?:\/\//.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#0A84FF"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}"></head><body><p><a href="${esc(url)}">${esc(title)}</a></p></body></html>`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = req.headers['user-agent'] || '';
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim();
      if (!id) {
        const list = await fetch(`${SUPABASE_URL}/rest/v1/cartouches?select=*&order=created_at.desc&limit=18`, { headers: headers() });
        const rows = list.ok ? await list.json() : [];
        res.status(200).json({ ok: true, plates: Array.isArray(rows) ? rows : [] });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/cartouches?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      const row = Array.isArray(rows) ? rows[0] : null;
      const dest = `${proto}://${host}/cartouche/${encodeURIComponent(id)}`;
      if (isBot(ua) || req.query.embed === '1') {
        const title = row ? `${row.legend} — cartouche` : 'cartouche — rankvault';
        const desc = row ? `${row.file_name} · ${prettySize(row.size)}${row.maker ? ' · ' + row.maker : ''}. a label plate, not a drawer.` : 'Stamp a legend on a local file. Large drops are warned, never refused.';
        const image = row && /^image\//.test(row.mime || '') && /^https?:\/\//.test(row.file_url || '') ? row.file_url : undefined;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        res.status(200).send(cardHtml({ title, desc, url: dest, image }));
        return;
      }
      if (!row) { res.status(404).json({ error: 'plate not found' }); return; }
      const warn = Number(row.size) > 12 * 1024 * 1024 ? 'large drop. opening it may feel slow.' : null;
      res.status(200).json({ ok: true, ...row, warn });
      return;
    }
    if (req.method === 'POST') {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch { body = {}; }
      const legend = String(body.legend || '').trim().slice(0, 80);
      const maker = String(body.maker || '').trim().slice(0, 80);
      const name = String(body.name || 'file').slice(0, 240);
      const type = String(body.type || 'application/octet-stream').slice(0, 120);
      const dataUrl = String(body.dataUrl || '');
      if (!legend || !dataUrl.startsWith('data:')) {
        res.status(400).json({ error: 'a legend and a local file are required' });
        return;
      }
      const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) { res.status(400).json({ error: 'could not read that file' }); return; }
      const buf = Buffer.from(m[2], 'base64');
      const id = uid();
      const warn = buf.length > 12 * 1024 * 1024 ? 'large drop. this one may feel slow. it was not refused.' : null;
      const stored = await storeFile(id, name, type, buf);
      let fileUrl = stored.url;
      if (!fileUrl && buf.length <= 700 * 1024) fileUrl = dataUrl;
      if (!fileUrl) {
        res.status(502).json({ error: 'storage did not take the file. it was not refused for size. retry.', detail: stored.detail || null, warn });
        return;
      }
      const share = {
        id,
        name,
        mime: type,
        size: buf.length,
        file_url: fileUrl,
        is_public: true,
        download_count: 0,
        author: maker || null,
        caption: legend,
        meta: { desk: 'cartouche', legend, maker: maker || null, warn },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const insShare = await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, { method: 'POST', headers: headers(), body: JSON.stringify(share) });
      if (!insShare.ok) {
        res.status(502).json({ error: 'the plate did not land in the share table', detail: (await insShare.text()).slice(0, 240) });
        return;
      }
      const plate = { id, legend, maker: maker || null, file_name: name, mime: type, size: buf.length, file_url: fileUrl, share_id: id };
      await fetch(`${SUPABASE_URL}/rest/v1/cartouches`, { method: 'POST', headers: headers(), body: JSON.stringify(plate) });
      res.status(200).json({ ok: true, id, link: `${proto}://${host}/cartouche/${encodeURIComponent(id)}`, share: `${proto}://${host}/s/${encodeURIComponent(id)}`, warn, size: buf.length, file_url: fileUrl.startsWith('data:') ? null : fileUrl });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'cartouche failed' });
  }
}
