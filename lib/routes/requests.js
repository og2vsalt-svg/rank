const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim().slice(0, 64);
      const url = id
        ? `${SUPABASE_URL}/rest/v1/file_requests?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
        : `${SUPABASE_URL}/rest/v1/file_requests?select=*&order=created_at.desc&limit=40`;
      const r = await fetch(url, { headers: headers() });
      if (!r.ok) {
        res.status(502).json({ error: 'request board did not answer' });
        return;
      }
      const rows = await r.json();
      res.status(200).json({ ok: true, requests: rows });
      return;
    }
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const title = String(body.title || '').trim().slice(0, 140);
      if (!title) {
        res.status(400).json({ error: 'title required' });
        return;
      }
      const row = {
        id: uid(),
        title,
        note: String(body.note || '').trim().slice(0, 500) || null,
        author: String(body.author || 'bobstay').trim().slice(0, 80) || 'bobstay',
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/file_requests`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        res.status(502).json({ error: 'request was not written', detail: (await r.text()).slice(0, 180) });
        return;
      }
      const rows = await r.json();
      const saved = Array.isArray(rows) ? rows[0] : rows;
      res.status(200).json({ ok: true, request: saved, card: `/bobstay/${saved.id}` });
      return;
    }
    if (req.method === 'PATCH') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const id = String(body.id || '').trim().slice(0, 64);
      const shareId = String(body.fulfilledShareId || '').trim().slice(0, 64);
      if (!id || !shareId) {
        res.status(400).json({ error: 'id and fulfilledShareId required' });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/file_requests?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ fulfilled_share_id: shareId }),
      });
      if (!r.ok) {
        res.status(502).json({ error: 'request was not updated' });
        return;
      }
      res.status(200).json({ ok: true, card: `/s/${shareId}` });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'requests failed' });
  }
}
