const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function headers() {
  return { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function pretty(n) {
  const size = Number(n) || 0;
  if (size < 1024) return size + ' b';
  if (size < 1048576) return (size / 1024).toFixed(1) + ' kb';
  if (size < 1073741824) return (size / 1048576).toFixed(2) + ' mb';
  return (size / 1073741824).toFixed(2) + ' gb';
}
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function cardHtml(card) {
  const image = card.image || 'https://og2vsalt-svg.github.io/rank/og.png';
  return '<!doctype html><html><head><meta charset="utf-8" />'
    + '<meta name="theme-color" content="' + esc(card.color || '#0A84FF') + '" />'
    + '<meta property="og:site_name" content="rankvault" />'
    + '<meta property="og:type" content="website" />'
    + '<meta property="og:title" content="' + esc(card.title) + '" />'
    + '<meta property="og:description" content="' + esc(card.desc) + '" />'
    + '<meta property="og:url" content="' + esc(card.url) + '" />'
    + '<meta property="og:image" content="' + esc(image) + '" />'
    + '<meta name="twitter:card" content="summary_large_image" />'
    + '<meta name="twitter:title" content="' + esc(card.title) + '" />'
    + '<meta name="twitter:description" content="' + esc(card.desc) + '" />'
    + '<meta name="twitter:image" content="' + esc(image) + '" />'
    + '<title>' + esc(card.title) + '</title></head><body><p><a href="' + esc(card.url) + '">' + esc(card.title) + '</a></p></body></html>';
}
async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = (req.headers['user-agent'] || '').toString();
  const id = (req.query.id || '').toString().trim();
  const bot = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely/i.test(ua);
  try {
    if (req.method === 'GET' && req.query.table === 'ledger') {
      const r = await fetch(SUPABASE_URL + '/rest/v1/ledger_marks?select=id,label,detail,href,created_at&order=created_at.desc&limit=24', { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ rows: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'POST' && req.query.table === 'ledger') {
      const body = await readJson(req);
      const label = String(body.label || '').trim().slice(0, 140);
      if (!label) { res.status(400).json({ error: 'label required' }); return; }
      const r = await fetch(SUPABASE_URL + '/rest/v1/ledger_marks', { method: 'POST', headers: headers(), body: JSON.stringify({ label, detail: String(body.detail || '').slice(0, 500), href: String(body.href || '').slice(0, 400) }) });
      const text = await r.text();
      if (!r.ok) { res.status(502).json({ error: text.slice(0, 280) }); return; }
      res.status(200).json({ row: JSON.parse(text)[0] });
      return;
    }
    if (req.method === 'GET' && id && req.query.download === '1') {
      const r = await fetch(SUPABASE_URL + '/rest/v1/atelier_drops?id=eq.' + encodeURIComponent(id) + '&select=name,mime,bytes&limit=1', { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      const row = rows && rows[0];
      if (!row || !row.bytes) { res.status(404).json({ error: 'missing' }); return; }
      const hex = String(row.bytes).replace(/^\\x/, '');
      const buf = Buffer.from(hex, 'hex');
      res.setHeader('Content-Type', row.mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', 'inline; filename="' + String(row.name || 'file').replace(/"/g, '') + '"');
      res.status(200).send(buf);
      return;
    }
    if (req.method === 'GET' && (bot || req.query.embed === '1')) {
      let title = 'atelier — rankvault';
      let desc = 'drop a local file into the database. no size cap — large files only get a slowness warning. discord cards on every link.';
      let image = '';
      if (id) {
        const r = await fetch(SUPABASE_URL + '/rest/v1/atelier_drops?id=eq.' + encodeURIComponent(id) + '&select=name,mime,size,note&limit=1', { headers: headers() });
        const rows = r.ok ? await r.json() : [];
        const row = rows && rows[0];
        if (row) {
          title = row.name + ' — atelier';
          desc = (row.note || 'a local file kept in the database') + '. ' + pretty(row.size) + '. large drops are warned, never refused.';
          if (/^image\//.test(row.mime || '')) image = proto + '://' + host + '/api/atelier?id=' + encodeURIComponent(id) + '&download=1';
        }
      }
      const dest = id ? proto + '://' + host + '/atelier/' + encodeURIComponent(id) : proto + '://' + host + '/atelier';
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(cardHtml({ title, desc, url: dest, image, color: '#0A84FF' }));
      return;
    }
    if (req.method === 'GET' && !id) {
      const r = await fetch(SUPABASE_URL + '/rest/v1/atelier_drops?select=id,name,mime,size,note,accent,author,created_at&order=created_at.desc&limit=20', { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ rows: Array.isArray(rows) ? rows : [] });
      return;
    }
    if (req.method === 'GET' && id) {
      const r = await fetch(SUPABASE_URL + '/rest/v1/atelier_drops?id=eq.' + encodeURIComponent(id) + '&select=id,name,mime,size,note,accent,author,created_at&limit=1', { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ row: rows && rows[0] ? rows[0] : null });
      return;
    }
    if (req.method === 'POST') {
      const body = await readJson(req);
      const buf = Buffer.from(String(body.data || ''), 'base64');
      const dropId = uid();
      const row = { id: dropId, name: String(body.name || 'untitled').slice(0, 512), mime: String(body.mime || 'application/octet-stream').slice(0, 180), size: buf.length, note: String(body.note || '').slice(0, 400), accent: '#0A84FF', author: String(body.author || '').slice(0, 80), bytes: '\\x' + buf.toString('hex') };
      const r = await fetch(SUPABASE_URL + '/rest/v1/atelier_drops', { method: 'POST', headers: headers(), body: JSON.stringify(row) });
      const text = await r.text();
      if (!r.ok) { res.status(502).json({ error: text.slice(0, 400) }); return; }
      res.status(200).json({ id: dropId, name: row.name, size: buf.length, url: proto + '://' + host + '/atelier/' + dropId, download: proto + '://' + host + '/api/atelier?id=' + dropId + '&download=1' });
      return;
    }
    res.status(405).json({ error: 'method' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'atelier failed' });
  }
}
