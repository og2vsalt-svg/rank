const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pretty(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|embedly|iframely|applebot|pinterest/i.test(ua || '');
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

async function sb(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data, text };
}

function card(res, row, url) {
  const title = row ? (row.title || row.file_name || 'clip') + ' — rankvault' : 'clip — rankvault';
  const desc = row
    ? [row.body, row.file_name ? pretty(row.size) + ' filed' : 'a note, not a drawer'].filter(Boolean).join(' · ').slice(0, 280)
    : 'a short clip beside the file desk. large drops are warned, never refused.';
  const image = row && /^image\//.test(row.mime || '') && /^https?:\/\//i.test(row.file_url || '')
    ? row.file_url
    : 'https://og2vsalt-svg.github.io/rank/og.png';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"/><meta name="theme-color" content="#0A84FF"/><meta property="og:type" content="website"/><meta property="og:site_name" content="rankvault"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(desc)}"/><meta property="og:image" content="${esc(image)}"/><meta property="og:image:secure_url" content="${esc(image)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:url" content="${esc(url)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(desc)}"/><meta name="twitter:image" content="${esc(image)}"/></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;letter-spacing:.14em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}

export default async function handler(req, res) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const id = String((req.query && req.query.id) || '').trim();
  const ua = req.headers['user-agent'] || '';

  if (req.method === 'GET') {
    if (!id) {
      if (isBot(ua) || req.query.card === '1') {
        card(res, null, `${proto}://${host}/clip`);
        return;
      }
      const list = await sb('clips?select=id,title,body,file_name,mime,size,author,created_at,share_id&order=created_at.desc&limit=24');
      res.status(list.ok ? 200 : 500).json(list.ok ? list.data : { error: 'could not read clips' });
      return;
    }
    const got = await sb(`clips?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const row = Array.isArray(got.data) ? got.data[0] : null;
    if (isBot(ua) || req.query.card === '1') {
      card(res, row, `${proto}://${host}/clip/${encodeURIComponent(id)}`);
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'that clip is not on the rail' });
      return;
    }
    res.status(200).json(row);
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const body = await readBody(req);
  const clipId = String(body.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  if (!clipId) {
    res.status(400).json({ error: 'missing id' });
    return;
  }
  const title = String(body.title || '').slice(0, 140);
  const note = String(body.body || '').slice(0, 4000);
  if (!title && !note && !body.file_url && !body.share_id) {
    res.status(400).json({ error: 'write a note or attach a file' });
    return;
  }
  const size = Number(body.size) || 0;
  const warn = size > 40 * 1024 * 1024 ? 'large drop. the browser may feel slow while it sends. nothing is refused.' : null;
  const row = {
    id: clipId,
    title: title || body.file_name || 'clip',
    body: note,
    share_id: body.share_id || null,
    file_name: body.file_name || null,
    mime: body.mime || null,
    size,
    file_url: body.file_url || null,
    author: body.author ? String(body.author).slice(0, 80) : null,
  };
  const ins = await sb('clips', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(row),
  });
  if (!ins.ok) {
    res.status(500).json({ error: 'could not write the clip', detail: String(ins.text || '').slice(0, 180) });
    return;
  }
  const saved = Array.isArray(ins.data) ? ins.data[0] : row;
  res.status(200).json({ ok: true, warn, clip: saved, url: `/clip/${clipId}` });
}
