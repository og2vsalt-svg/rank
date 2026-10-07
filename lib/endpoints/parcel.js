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
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|embedly|discordbot/i.test(ua || '');
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
  const path = `parcel/${id}/${safe}`;
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
function shape(row) {
  const meta = row.meta || {};
  return {
    id: row.id,
    toName: meta.toName || row.author || 'someone',
    returnNote: meta.returnNote || row.caption || '',
    fromName: meta.fromName || null,
    file_name: row.name,
    mime: row.mime,
    size: Number(row.size) || 0,
    file_url: row.file_url,
    created_at: row.created_at,
  };
}
async function getRow(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
  if (!r.ok) return null;
  const rows = await r.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || (row.meta && row.meta.desk && row.meta.desk !== 'parcel')) return row && row.meta && row.meta.desk ? null : row;
  return row;
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
        const list = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?is_public=eq.true&meta->>desk=eq.parcel&select=id,name,mime,size,file_url,author,caption,meta,created_at&order=created_at.desc&limit=18`, { headers: headers() });
        const rows = list.ok ? await list.json() : [];
        res.status(200).json({ ok: true, parcels: (Array.isArray(rows) ? rows : []).map(shape) });
        return;
      }
      const row = await getRow(id);
      const dest = `${proto}://${host}/parcel/${encodeURIComponent(id)}`;
      if (isBot(ua) || req.query.embed === '1') {
        const view = row ? shape(row) : null;
        const title = view ? `parcel for ${view.toName}` : 'parcel — rankvault';
        const desc = view ? `${view.file_name} · ${prettySize(view.size)}${view.returnNote ? ' · ' + view.returnNote : ''}. large drops are warned, never refused.` : 'address a local file to someone. not a cabinet.';
        const image = view && /^image\//.test(view.mime || '') && /^https?:\/\//.test(view.file_url || '') ? view.file_url : undefined;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        res.status(200).send(cardHtml({ title, desc, url: dest, image }));
        return;
      }
      if (!row || (row.meta && row.meta.desk && row.meta.desk !== 'parcel')) {
        res.status(404).json({ error: 'parcel not found' });
        return;
      }
      const view = shape(row);
      const warn = view.size > 12 * 1024 * 1024 ? 'large drop. opening it may feel slow.' : null;
      res.status(200).json({ ok: true, ...view, warn });
      return;
    }
    if (req.method === 'POST') {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch { body = {}; }
      const toName = String(body.toName || '').trim().slice(0, 80);
      const returnNote = String(body.returnNote || '').trim().slice(0, 400);
      const fromName = String(body.fromName || '').trim().slice(0, 80);
      const name = String(body.name || 'file').slice(0, 240);
      const type = String(body.type || 'application/octet-stream').slice(0, 120);
      const dataUrl = String(body.dataUrl || '');
      if (!toName || !dataUrl.startsWith('data:')) {
        res.status(400).json({ error: 'a recipient and a local file are required' });
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
      const row = {
        id,
        name,
        mime: type,
        size: buf.length,
        file_url: fileUrl,
        is_public: true,
        download_count: 0,
        author: fromName || null,
        caption: returnNote || null,
        meta: { desk: 'parcel', toName, returnNote, fromName: fromName || null, warn },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const ins = await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      if (!ins.ok) {
        res.status(502).json({ error: 'the parcel did not land in the share table', detail: (await ins.text()).slice(0, 240) });
        return;
      }
      res.status(200).json({ ok: true, id, link: `${proto}://${host}/parcel/${encodeURIComponent(id)}`, warn, size: buf.length, file_url: fileUrl.startsWith('data:') ? null : fileUrl });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'parcel failed' });
  }
}
