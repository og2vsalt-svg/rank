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

function pretty(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
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

  if (req.method === 'GET') {
    if (!id) {
      card(res, {
        title: 'garboard — rankvault',
        desc: 'the lowest plank. a local file lands in the share table, with a seam note beside it. large files are warned, never refused.',
        url: `${proto}://${host}/garboard`,
      });
      return;
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/garboards?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
    const rows = r.ok ? await r.json() : [];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (req.query.json === '1') {
      res.status(row ? 200 : 404).json(row || { error: 'not found' });
      return;
    }
    card(res, {
      title: row ? `${row.file_name} — garboard` : 'garboard — rankvault',
      desc: row ? `${row.seam || 'a measured seam'} · ${pretty(row.size)} · ${row.port_side || 'port'} / ${row.starboard_side || 'starboard'}` : 'a plank note beside a filed file.',
      url: `${proto}://${host}/garboard/${encodeURIComponent(id)}`,
    });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const nextId = String(body.id || '').slice(0, 64);
    if (!nextId || !body.file_name) {
      res.status(400).json({ error: 'id and file_name required' });
      return;
    }
    const row = {
      id: nextId,
      share_id: body.share_id || null,
      file_name: String(body.file_name).slice(0, 512),
      seam: String(body.seam || '').slice(0, 280),
      port_side: String(body.port_side || '').slice(0, 80),
      starboard_side: String(body.starboard_side || '').slice(0, 80),
      size: Number(body.size) || 0,
      author: body.author ? String(body.author).slice(0, 80) : null,
    };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/garboards`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      res.status(502).json({ error: await r.text() });
      return;
    }
    res.status(200).json({ ok: true, id: nextId, path: `/garboard/${nextId}` });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
