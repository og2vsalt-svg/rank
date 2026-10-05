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

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function sb(path, init) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init && init.headers) } });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

function html({ title, desc, url, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#0A84FF" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(img)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(img)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.08em;text-transform:uppercase;font-size:13px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const page = String(req.query.page || 'quarter').toLowerCase();
  const id = String(req.query.id || '').trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const dest = `${proto}://${host}/${page}${id ? '/' + encodeURIComponent(id) : ''}`;
  const ua = String(req.headers['user-agent'] || '');
  const bot = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely|bot|crawler|spider/i.test(ua);

  if (req.method === 'GET' && req.query.list === '1') {
    const listed = await sb('quarters?select=id,title,body,when_label,share_id,author,created_at&order=created_at.desc&limit=24');
    res.status(listed.ok ? 200 : 502).json({ ok: listed.ok, quarters: listed.data || [] });
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};
    const title = String(body.title || '').trim().slice(0, 140);
    const note = String(body.body || '').trim().slice(0, 4000);
    if (!title || !note) {
      res.status(400).json({ error: 'title and body are required' });
      return;
    }
    const row = {
      id: String(body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).slice(0, 64),
      title,
      body: note,
      when_label: body.whenLabel ? String(body.whenLabel).slice(0, 80) : null,
      share_id: body.shareId ? String(body.shareId).slice(0, 64) : null,
      author: body.author ? String(body.author).slice(0, 40) : page,
    };
    const saved = await sb('quarters', { method: 'POST', body: JSON.stringify(row) });
    if (!saved.ok) {
      res.status(502).json({ error: 'quarters table did not take the note', detail: typeof saved.data === 'string' ? saved.data.slice(0, 240) : saved.data });
      return;
    }
    const savedRow = Array.isArray(saved.data) ? saved.data[0] : saved.data;
    res.status(200).json({ ok: true, quarter: savedRow || row, embedPath: `/${page}/${row.id}` });
    return;
  }

  let title = page === 'bilge' ? 'bilge — a watch, not a drawer' : 'quarter — a desk, not a drawer';
  let desc = page === 'bilge'
    ? 'A quiet watch board. Leave a line about what you are keeping an eye on. Discord unfurls /bilge. Large attached files are warned, never refused.'
    : 'A reading desk. Write the sitting, optionally hand a local file to the share table. Discord unfurls /quarter and /s. Large files are warned, never refused.';
  let image;
  if (id) {
    const rowRes = await sb(`quarters?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const row = Array.isArray(rowRes.data) && rowRes.data[0] ? rowRes.data[0] : null;
    if (row) {
      title = `${row.title} — ${page}`;
      desc = `${row.when_label ? row.when_label + ' · ' : ''}${row.body}`;
      if (row.share_id) {
        const share = await sb(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=mime,file_url&limit=1`);
        const shareRow = Array.isArray(share.data) && share.data[0] ? share.data[0] : null;
        if (shareRow && String(shareRow.mime || '').startsWith('image/')) image = shareRow.file_url;
      }
    }
  }

  if (req.method === 'GET' && req.query.json === '1') {
    res.status(200).json({ ok: true, title, desc });
    return;
  }

  if (!bot && req.query.embed !== '1') {
    res.statusCode = 302;
    res.setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.statusCode = 200;
  res.end(html({ title, desc, url: dest, image }));
}
