const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PATCH');
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

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object' && !req.readable) return Buffer.from(JSON.stringify(req.body));
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function getShare(id) {
  if (!id) return null;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,author,caption,created_at&limit=1`, { headers: headers() });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const origin = host ? `${proto}://${host}` : '';
  try {
    if (req.method === 'GET') {
      const id = String((req.query && req.query.id) || '').trim();
      if (id) {
        const note = await fetch(`${SUPABASE_URL}/rest/v1/architraves?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
        const notes = note.ok ? await note.json() : [];
        const row = Array.isArray(notes) ? notes[0] : null;
        if (!row) {
          res.status(404).json({ error: 'that beam is not set' });
          return;
        }
        const share = await getShare(row.share_id);
        res.status(200).json({
          ok: true,
          ...row,
          share,
          link: origin ? `${origin}/architrave/${row.id}` : `/architrave/${row.id}`,
        });
        return;
      }
      const list = await fetch(`${SUPABASE_URL}/rest/v1/architraves?select=id,share_id,beam,for_whom,reply,author,name,size,created_at&order=created_at.desc&limit=24`, { headers: headers() });
      const beams = list.ok ? await list.json() : [];
      res.status(200).json({ ok: true, beams: Array.isArray(beams) ? beams : [] });
      return;
    }

    if (req.method === 'POST') {
      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const id = uid();
      const row = {
        id,
        share_id: body.shareId ? String(body.shareId).slice(0, 64) : null,
        beam: String(body.beam || body.note || '').slice(0, 500) || null,
        for_whom: String(body.forWhom || '').slice(0, 80) || null,
        reply: null,
        author: String(body.author || '').slice(0, 80) || null,
        name: String(body.name || 'file').slice(0, 180),
        mime: body.mime || null,
        size: Number(body.size) || 0,
      };
      if (!row.share_id && !row.beam) {
        res.status(400).json({ error: 'add a file, a line, or both' });
        return;
      }
      const saved = await fetch(`${SUPABASE_URL}/rest/v1/architraves`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!saved.ok) {
        const detail = await saved.text();
        res.status(502).json({ error: 'the beam did not land', detail: detail.slice(0, 280) });
        return;
      }
      res.status(200).json({
        ok: true,
        id,
        link: origin ? `${origin}/architrave/${id}` : `/architrave/${id}`,
        warn: row.size > 12 * 1024 * 1024 ? 'large drop. it will go through, it may just take a moment.' : null,
      });
      return;
    }

    if (req.method === 'PATCH') {
      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const id = String(body.id || '').trim().slice(0, 64);
      const reply = String(body.reply || '').slice(0, 500);
      if (!id || !reply) {
        res.status(400).json({ error: 'id and reply required' });
        return;
      }
      const saved = await fetch(`${SUPABASE_URL}/rest/v1/architraves?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ reply }),
      });
      if (!saved.ok) {
        const detail = await saved.text();
        res.status(502).json({ error: 'the reply did not land', detail: detail.slice(0, 240) });
        return;
      }
      res.status(200).json({ ok: true, id, link: origin ? `${origin}/taenia/${id}` : `/taenia/${id}` });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'architrave failed' });
  }
}
