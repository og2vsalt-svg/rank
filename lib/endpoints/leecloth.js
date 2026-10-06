const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prettySize(size) {
  const n = Number(size) || 0;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function headers() {
  return { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' };
}

function pageHtml({ title, desc, url, image }) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="' + esc(title) + '" /><meta property="og:description" content="' + esc(desc) + '" /><meta property="og:url" content="' + esc(url) + '" /><meta property="og:image" content="' + esc(image) + '" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="' + esc(title) + '" /><meta name="twitter:description" content="' + esc(desc) + '" /><meta name="twitter:image" content="' + esc(image) + '" /><meta name="theme-color" content="#0A84FF" /></head><body style="margin:0;background:#070708;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;font-size:12px;letter-spacing:.14em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">' + esc(title) + '</h1><p style="color:#a1a1aa">' + esc(desc) + '</p></body></html>';
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const id = String((req.query && req.query.id) || '').trim();
  const page = String((req.query && req.query.page) || 'leecloth').toLowerCase();
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const origin = proto + '://' + host;
  const dest = id ? origin + '/' + page + '/' + encodeURIComponent(id) : origin + '/' + page;
  const image = 'https://og2vsalt-svg.github.io/rank/og.png';
  const ua = String(req.headers['user-agent'] || '');
  const wantsHtml = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely|redditbot|applebot/i.test(ua) || String(req.query.html || '') === '1';

  if (req.method === 'GET') {
    if (page === 'crossjack') {
      let title = 'crossjack — a watch log, not a vault';
      let desc = 'Write a watch note. Discord gets a card. Files stay on leechoth.';
      if (id) {
        const r = await fetch(SUPABASE_URL + '/rest/v1/crossjacks?id=eq.' + encodeURIComponent(id) + '&select=watch,note,author,link&limit=1', { headers: headers() });
        if (r.ok) {
          const rows = await r.json();
          const row = rows && rows[0];
          if (row) {
            title = row.watch;
            desc = (row.note || 'watch note') + (row.author ? ' · ' + row.author : '');
          }
        }
      }
      if (wantsHtml) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.status(200).send(pageHtml({ title, desc, url: dest, image })); return; }
      res.status(200).json({ ok: true, title, desc, url: dest });
      return;
    }

    let title = 'leecloth — a local file kept in the database';
    let desc = 'Drop a local file into Postgres. No size cap, only a note if the write might feel slow. Discord cards on every link.';
    if (id) {
      const r = await fetch(SUPABASE_URL + '/rest/v1/leecloths?id=eq.' + encodeURIComponent(id) + '&select=name,note,author,size,mime,file_url&limit=1', { headers: headers() });
      if (r.ok) {
        const rows = await r.json();
        const row = rows && rows[0];
        if (row) {
          title = row.name || 'leecloth file';
          desc = (row.note || 'shared file') + ' · ' + prettySize(row.size) + (row.author ? ' · ' + row.author : '');
        }
      }
    }
    if (wantsHtml) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.status(200).send(pageHtml({ title, desc, url: dest, image })); return; }
    if (id) {
      const r = await fetch(SUPABASE_URL + '/rest/v1/leecloths?id=eq.' + encodeURIComponent(id) + '&select=id,name,mime,size,note,author,file_url,created_at&limit=1', { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ ok: true, row: rows[0] || null });
      return;
    }
    const list = await fetch(SUPABASE_URL + '/rest/v1/leecloths?select=id,name,mime,size,note,author,file_url,created_at&order=created_at.desc&limit=24', { headers: headers() });
    res.status(200).json({ ok: true, rows: list.ok ? await list.json() : [] });
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const body = await readJson(req);
  const kind = String(body.kind || page || 'leecloth');
  const idNew = String(body.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8))).slice(0, 40);

  if (kind === 'crossjack') {
    const watch = String(body.watch || '').trim().slice(0, 180);
    if (!watch) { res.status(400).json({ ok: false, error: 'watch note is empty' }); return; }
    const row = { id: idNew, watch, note: String(body.note || '').slice(0, 800), author: String(body.author || '').slice(0, 80) || null, link: String(body.link || '').slice(0, 400) || null };
    const r = await fetch(SUPABASE_URL + '/rest/v1/crossjacks', { method: 'POST', headers: { ...headers(), Prefer: 'return=representation' }, body: JSON.stringify(row) });
    if (!r.ok) { res.status(502).json({ ok: false, error: 'database did not take the watch' }); return; }
    const saved = await r.json();
    res.status(200).json({ ok: true, row: saved[0] || row, url: origin + '/crossjack/' + idNew });
    return;
  }

  const name = String(body.name || 'untitled').slice(0, 180);
  const size = Number(body.size) || 0;
  const warn = size > 12 * 1024 * 1024 ? 'large drop. the tab may feel slow. it was not refused.' : null;
  const row = {
    id: idNew,
    name,
    mime: String(body.mime || 'application/octet-stream').slice(0, 120),
    size,
    note: String(body.note || '').slice(0, 500) || null,
    author: String(body.author || '').slice(0, 80) || null,
    file_url: String(body.file_url || '').slice(0, 800) || null,
    bytes_b64: body.bytes_b64 && size <= 700 * 1024 ? String(body.bytes_b64) : null,
  };
  const r = await fetch(SUPABASE_URL + '/rest/v1/leecloths', { method: 'POST', headers: { ...headers(), Prefer: 'return=representation' }, body: JSON.stringify(row) });
  if (!r.ok) {
    const detail = await r.text();
    res.status(502).json({ ok: false, error: 'database did not take the file yet. it was not refused for size.', detail: detail.slice(0, 240), warn });
    return;
  }
  const saved = await r.json();
  res.status(200).json({ ok: true, row: saved[0] || row, url: origin + '/leecloth/' + idNew, warn });
}
