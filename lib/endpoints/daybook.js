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

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, (ch) => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[ch]));
}

function cardHtml({ title, desc, url }) {
  const img = 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#0A84FF" /><meta property="og:type" content="article" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(img)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(img)}" /></head><body style="margin:0;background:#f5f5f7;color:#1d1d1f;font-family:Inter,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">daybook</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#6e6e73">${esc(desc)}</p></body></html>`;
}

function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  const id = String(req.query.id || '').slice(0, 80);
  try {
    if (req.method === 'GET') {
      if (req.query.list === '1') {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/daybook_entries?select=id,title,body,author,mood,created_at&order=created_at.desc&limit=20`, { headers: headers() });
        const rows = r.ok ? await r.json() : [];
        res.status(200).json({ ok: true, entries: rows });
        return;
      }
      if (!id) {
        res.status(200).send(cardHtml({ title: 'daybook', desc: 'A short page for the day. Not a file drawer. Paste /daybook/id in Discord.', url: `${origin}/daybook` }));
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/daybook_entries?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      const row = rows[0];
      if (!row) {
        res.status(404).send(cardHtml({ title: 'daybook', desc: 'That page is not in the book.', url: `${origin}/daybook/${id}` }));
        return;
      }
      res.status(200).send(cardHtml({
        title: row.title,
        desc: `${row.body.slice(0, 180)}${row.author ? ` — ${row.author}` : ''}`,
        url: `${origin}/daybook/${row.id}`,
      }));
      return;
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const title = String(body.title || '').trim().slice(0, 160);
    const text = String(body.body || '').trim().slice(0, 8000);
    if (!title || !text) return res.status(400).json({ error: 'title and page are required' });
    const shareId = uid();
    const row = { id: shareId, title, body: text, author: String(body.author || '').slice(0, 80), mood: String(body.mood || '').slice(0, 40) };
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/daybook_entries`, { method: 'POST', headers: headers(), body: JSON.stringify(row) });
    if (!ins.ok) return res.status(502).json({ error: await ins.text() });
    res.status(200).json({ ok: true, id: shareId, sharePath: `/daybook/${shareId}` });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'daybook failed' });
  }
}
