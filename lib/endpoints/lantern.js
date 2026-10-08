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

function headers(extra) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...(extra || {}),
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
        const note = await fetch(`${SUPABASE_URL}/rest/v1/receipts?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: headers() });
        const notes = note.ok ? await note.json() : [];
        const row = Array.isArray(notes) ? notes[0] : null;
        const share = row ? await getShare(row.share_id) : await getShare(id);
        if (!row && !share) {
          res.status(404).json({ error: 'that lantern is not on the table' });
          return;
        }
        res.status(200).json({
          ok: true,
          id: row?.id || share.id,
          note: row?.note || share?.caption || '',
          author: row?.author || share?.author || '',
          name: row?.name || share?.name || 'file',
          share,
          link: origin ? `${origin}/lantern/${row?.id || share.id}` : `/lantern/${row?.id || share.id}`,
        });
        return;
      }
      const list = await fetch(`${SUPABASE_URL}/rest/v1/receipts?name=like.lantern%25&select=id,share_id,name,note,author,size,created_at&order=created_at.desc&limit=18`, { headers: headers() });
      const notes = list.ok ? await list.json() : [];
      const shares = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,file_url,author,caption,created_at&order=created_at.desc&limit=12`, { headers: headers() });
      const shelf = shares.ok ? await shares.json() : [];
      res.status(200).json({
        ok: true,
        notes: Array.isArray(notes) ? notes : [],
        shares: Array.isArray(shelf) ? shelf : [],
      });
      return;
    }

    if (req.method === 'POST') {
      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const id = uid();
      const note = String(body.note || body.caption || '').slice(0, 2000);
      const author = String(body.author || '').slice(0, 80) || null;
      const shareId = body.shareId ? String(body.shareId).slice(0, 64) : null;
      const name = `lantern ${String(body.name || 'reading').slice(0, 120)}`;
      const row = {
        id,
        share_id: shareId,
        name,
        mime: body.mime || null,
        size: Number(body.size) || 0,
        note: note || null,
        author,
      };
      const saved = await fetch(`${SUPABASE_URL}/rest/v1/receipts`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!saved.ok) {
        const detail = await saved.text();
        res.status(502).json({ error: 'the reading note did not land', detail: detail.slice(0, 280) });
        return;
      }
      const rows = await saved.json();
      const stored = Array.isArray(rows) ? rows[0] : row;
      res.status(200).json({
        ok: true,
        id: stored.id || id,
        link: origin ? `${origin}/lantern/${stored.id || id}` : `/lantern/${stored.id || id}`,
      });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'lantern failed' });
  }
}
