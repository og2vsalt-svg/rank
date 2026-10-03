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

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function cleanTarget(raw) {
  const text = String(raw || '').trim().slice(0, 500);
  if (!text) return '';
  try {
    const url = new URL(text.startsWith('http') ? text : `https://${text}`);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  try {
    if (req.method === 'GET') {
      const id = (req.query.id || '').toString().trim();
      const path = id
        ? `soundings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
        : 'soundings?select=id,target,note,status_code,ok,elapsed_ms,author,created_at&order=created_at.desc&limit=24';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers() });
      const rows = r.ok ? await r.json() : [];
      if (id) {
        if (!rows[0]) {
          res.status(404).json({ error: 'sounding not found' });
          return;
        }
        res.status(200).json({ ok: true, sounding: rows[0] });
        return;
      }
      res.status(200).json({ ok: true, soundings: Array.isArray(rows) ? rows : [] });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }

    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const target = cleanTarget(body.target);
    if (!target) {
      res.status(400).json({ error: 'need a real http address' });
      return;
    }
    const started = Date.now();
    let statusCode = 0;
    let ok = false;
    try {
      const probe = await fetch(target, { method: 'GET', redirect: 'follow' });
      statusCode = probe.status;
      ok = probe.ok;
    } catch {
      statusCode = 0;
      ok = false;
    }
    const elapsed = Date.now() - started;
    const id = uid();
    const row = {
      id,
      target,
      note: String(body.note || '').slice(0, 180),
      status_code: statusCode,
      ok,
      elapsed_ms: elapsed,
      author: String(body.author || 'sounding').slice(0, 60),
    };
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/soundings`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(row),
    });
    if (!ins.ok) {
      const detail = await ins.text();
      res.status(502).json({ error: 'the soundings table did not take the row', detail: detail.slice(0, 200) });
      return;
    }
    const warn = elapsed > 4000 ? 'that address was slow to answer. the reading is still kept.' : null;
    res.status(200).json({ ok: true, id, sounding: row, sharePath: `/sounding/${id}`, warn });
  } catch (err) {
    res.status(500).json({ error: err.message || 'sounding failed' });
  }
}
