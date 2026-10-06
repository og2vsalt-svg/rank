import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

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

function sbHeaders() {
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
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function parseMultipart(buf, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!boundaryMatch) return [];
  const boundary = Buffer.from('--' + (boundaryMatch[1] || boundaryMatch[2]).trim());
  const parts = [];
  let start = buf.indexOf(boundary);
  while (start !== -1) {
    start += boundary.length;
    if (buf.slice(start, start + 2).toString() === '--') break;
    if (buf.slice(start, start + 2).toString() === '\r\n') start += 2;
    const next = buf.indexOf(boundary, start);
    if (next === -1) break;
    const chunk = buf.slice(start, next - 2);
    const sep = chunk.indexOf('\r\n\r\n');
    if (sep !== -1) {
      const head = chunk.slice(0, sep).toString('utf8');
      const body = chunk.slice(sep + 4);
      parts.push({
        name: /name="([^"]+)"/.exec(head)?.[1] || '',
        filename: /filename="([^"]*)"/.exec(head)?.[1] || '',
        type: /Content-Type:\s*([^\r\n]+)/i.exec(head)?.[1] || 'application/octet-stream',
        body,
      });
    }
    start = next;
  }
  return parts;
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pretty(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function cardHtml({ title, desc, url, image }) {
  const img = image || 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#1d1d1f" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(img)}" /><meta property="og:image:secure_url" content="${esc(img)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(img)}" /></head><body style="margin:0;background:#f5f5f7;color:#1d1d1f;font-family:Inter,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#6e6e73">${esc(desc)}</p></body></html>`;
}

async function listMarks() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/lodestone_marks?select=id,name,mime,size,heading,remark,author,file_url,created_at&order=created_at.desc&limit=24`, { headers: sbHeaders() });
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

async function getMark(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/lodestone_marks?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: sbHeaders() });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] : null;
}

async function notesFor(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/mariner_notes?mark_id=eq.${encodeURIComponent(id)}&select=id,body,author,created_at&order=created_at.desc&limit=12`, { headers: sbHeaders() });
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  const page = String(req.query.page || 'lodestone');
  const id = String(req.query.id || '').slice(0, 80);

  try {
    if (req.method === 'GET') {
      if (req.query.list === '1') {
        res.status(200).json({ ok: true, marks: await listMarks() });
        return;
      }
      if (req.query.notes === '1' && id) {
        res.status(200).json({ ok: true, notes: await notesFor(id) });
        return;
      }
      if (!id) {
        const title = page === 'mariner' ? 'mariner — readings on filed marks' : 'lodestone — a heading on a local file';
        const desc = page === 'mariner'
          ? 'A reading board for files already filed on lodestone. Not a vault drawer. Paste /mariner in Discord.'
          : 'A local file is written into the share table with a heading. Large files are warned, never refused. Paste /lodestone/id in Discord.';
        res.status(200).send(cardHtml({ title, desc, url: `${origin}/${page}` }));
        return;
      }
      const row = await getMark(id);
      if (!row) {
        res.status(404).send(cardHtml({ title: 'lodestone', desc: 'That mark is not on the board.', url: `${origin}/lodestone/${id}` }));
        return;
      }
      const image = row.mime && String(row.mime).startsWith('image/') ? row.file_url : '';
      res.status(200).send(cardHtml({
        title: row.name,
        desc: `${row.heading || 'no heading'} · ${row.remark || 'filed on lodestone'} · ${pretty(row.size)}${row.author ? ` · ${row.author}` : ''}`,
        url: `${origin}/lodestone/${row.id}`,
        image,
      }));
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }

    const ctype = req.headers['content-type'] || '';
    if (page === 'mariner' || ctype.includes('application/json')) {
      const raw = await readBody(req);
      let payload = {};
      try { payload = JSON.parse(raw.toString('utf8') || '{}'); } catch { payload = {}; }
      const markId = String(payload.mark_id || id || '').slice(0, 80);
      const body = String(payload.body || '').trim().slice(0, 500);
      const author = String(payload.author || '').trim().slice(0, 80);
      if (!markId || !body) {
        res.status(400).json({ error: 'a mark and a short reading are required' });
        return;
      }
      const mark = await getMark(markId);
      if (!mark) {
        res.status(404).json({ error: 'that mark is not on the board' });
        return;
      }
      const ins = await fetch(`${SUPABASE_URL}/rest/v1/mariner_notes`, {
        method: 'POST',
        headers: sbHeaders(),
        body: JSON.stringify({ mark_id: markId, body, author: author || null }),
      });
      if (!ins.ok) {
        res.status(502).json({ error: await ins.text() });
        return;
      }
      res.status(200).json({ ok: true, notes: await notesFor(markId) });
      return;
    }

    const buf = await readBody(req);
    const parts = parseMultipart(buf, ctype);
    const file = parts.find((part) => part.filename);
    if (!file || !file.body.length) {
      res.status(400).json({ error: 'choose a local file first' });
      return;
    }
    const heading = parts.find((part) => part.name === 'heading')?.body.toString('utf8').slice(0, 80) || '';
    const remark = parts.find((part) => part.name === 'remark')?.body.toString('utf8').slice(0, 280) || '';
    const author = parts.find((part) => part.name === 'author')?.body.toString('utf8').slice(0, 80) || '';
    const shareId = uid();
    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'file';
    let fileUrl = '';
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`lodestone/${shareId}/${safeName}`, file.body, {
          access: 'public',
          contentType: file.type,
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
          allowOverwrite: true,
        });
        fileUrl = blob.url;
      } catch {}
    }
    if (!fileUrl) {
      try {
        const up = await fetch(`${SUPABASE_URL}/storage/v1/object/shares/${shareId}/${safeName}`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': file.type,
            'x-upsert': 'true',
          },
          body: file.body,
        });
        if (up.ok) fileUrl = `${SUPABASE_URL}/storage/v1/object/public/shares/${shareId}/${safeName}`;
      } catch {}
    }
    const shareRow = {
      id: shareId,
      name: file.filename.slice(0, 512),
      mime: file.type,
      size: file.body.length,
      file_url: fileUrl || `${origin}/lodestone/${shareId}`,
      is_public: true,
      author: author || null,
      caption: remark || heading || null,
      meta: { desk: 'lodestone', heading: heading || null },
    };
    const shareIns = await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, {
      method: 'POST',
      headers: sbHeaders(),
      body: JSON.stringify(shareRow),
    });
    if (!shareIns.ok) {
      res.status(502).json({ error: await shareIns.text() });
      return;
    }
    const row = {
      id: shareId,
      name: file.filename.slice(0, 512),
      mime: file.type,
      size: file.body.length,
      file_url: fileUrl || null,
      heading,
      remark,
      author,
    };
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/lodestone_marks`, {
      method: 'POST',
      headers: sbHeaders(),
      body: JSON.stringify(row),
    });
    if (!ins.ok) {
      res.status(502).json({ error: await ins.text() });
      return;
    }
    const warn = file.body.length > 8 * 1024 * 1024
      ? 'this file is heavy. it was accepted, but the transfer can feel slow.'
      : (!fileUrl ? 'the row is in the share table. a public file url was not issued, so the card still unfurls.' : '');
    res.status(200).json({
      ok: true,
      id: shareId,
      sharePath: `/lodestone/${shareId}`,
      embedPath: `/lodestone/${shareId}`,
      url: fileUrl,
      warn,
    });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'lodestone failed' });
  }
}
