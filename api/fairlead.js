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

function cleanSteps(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((step) => ({
      id: String(step.id || uid()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24),
      text: String(step.text || '').trim().slice(0, 160),
      done: Boolean(step.done),
    }))
    .filter((step) => step.text)
    .slice(0, 16);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const id = (req.query.id || '').toString().trim();
    const url = id
      ? `${SUPABASE_URL}/rest/v1/fairlead_checks?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
      : `${SUPABASE_URL}/rest/v1/fairlead_checks?select=id,title,steps,note,share_id,file_name,author,created_at&order=created_at.desc&limit=20`;
    const r = await fetch(url, { headers: headers() });
    const rows = r.ok ? await r.json() : [];
    if (!r.ok) {
      res.status(502).json({ error: 'fairlead did not answer' });
      return;
    }
    res.status(200).json(id ? rows[0] || null : { ok: true, checks: rows });
    return;
  }

  if (req.method === 'PATCH') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = String(body.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    const steps = cleanSteps(body.steps);
    if (!id) {
      res.status(400).json({ error: 'id required' });
      return;
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/fairlead_checks?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ steps }),
    });
    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: text.slice(0, 240) || 'checklist was not updated' });
      return;
    }
    res.status(200).json({ ok: true, id });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const title = String(body.title || '').trim().slice(0, 140);
  const steps = cleanSteps(body.steps);
  if (!title) {
    res.status(400).json({ error: 'a checklist needs a title' });
    return;
  }
  if (!steps.length) {
    res.status(400).json({ error: 'add at least one step' });
    return;
  }
  const id = String(body.id || uid()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) || uid();
  const row = {
    id,
    title,
    steps,
    note: body.note ? String(body.note).slice(0, 280) : null,
    share_id: body.shareId ? String(body.shareId).slice(0, 64) : null,
    file_name: body.fileName ? String(body.fileName).slice(0, 180) : null,
    author: body.author ? String(body.author).slice(0, 60) : 'fairlead',
  };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/fairlead_checks`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(row),
  });
  const text = await r.text();
  if (!r.ok) {
    res.status(502).json({ error: text.slice(0, 240) || 'checklist was not written' });
    return;
  }
  res.status(200).json({ ok: true, id, card: `/fairlead/${id}` });
}
