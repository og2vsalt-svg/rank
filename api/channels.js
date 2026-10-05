const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function card(res, { title, desc, url }) {
  const image = 'https://og2vsalt-svg.github.io/rank/og.png';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${image}"></head><body style="background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:56px 24px"><p style="opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const id = (req.query.id || '').toString().trim();

  if (req.method === 'GET' && req.query.list === '1') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/shelves?select=*&order=created_at.desc&limit=24`, { headers: headers() });
    const rows = r.ok ? await r.json() : [];
    res.status(200).json({ ok: true, shelves: Array.isArray(rows) ? rows : [] });
    return;
  }

  if (req.method === 'GET') {
    if (!id) {
      card(res, {
        title: 'channels — rankvault',
        desc: 'name a shelf, then hang share links already in the database. not another drawer.',
        url: `${proto}://${host}/channels`,
      });
      return;
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/shelves?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
    const rows = r.ok ? await r.json() : [];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (req.query.json === '1') {
      res.status(row ? 200 : 404).json(row || { error: 'not found' });
      return;
    }
    const count = row && Array.isArray(row.share_ids) ? row.share_ids.length : 0;
    card(res, {
      title: row ? `${row.title} — channels` : 'channels — rankvault',
      desc: row ? `${row.note || 'a shelf of filed links'} · ${count} share${count === 1 ? '' : 's'}` : 'a shelf, not a drawer.',
      url: `${proto}://${host}/channels/${encodeURIComponent(id)}`,
    });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const nextId = String(body.id || '').slice(0, 64);
    if (!nextId || !body.title) {
      res.status(400).json({ error: 'id and title required' });
      return;
    }
    const shareIds = Array.isArray(body.share_ids) ? body.share_ids.map((x) => String(x).slice(0, 64)).filter(Boolean).slice(0, 40) : [];
    const row = {
      id: nextId,
      title: String(body.title).slice(0, 120),
      note: body.note ? String(body.note).slice(0, 280) : null,
      share_ids: shareIds,
      author: body.author ? String(body.author).slice(0, 80) : null,
    };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/shelves?on_conflict=id`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      res.status(502).json({ error: await r.text() });
      return;
    }
    res.status(200).json({ ok: true, id: nextId, path: `/channels/${nextId}` });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
