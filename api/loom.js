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

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|applebot|iframely|unfurl|embedly|discordbot/i.test(ua || '');
}

async function sb(path, init) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init && init.headers) } });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  return data;
}

function cardHtml({ title, desc, url, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"/><meta name="theme-color" content="#0A84FF"/><meta property="og:type" content="website"/><meta property="og:site_name" content="rankvault"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(desc)}"/><meta property="og:image" content="${esc(img)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:url" content="${esc(url)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(desc)}"/><meta name="twitter:image" content="${esc(img)}"/></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;letter-spacing:.12em;text-transform:uppercase;font-size:12px">rankvault · loom</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = req.headers['user-agent'] || '';
  const id = (req.query.id || '').toString().trim();

  try {
    if (req.method === 'GET' && (req.query.card === '1' || isBot(ua))) {
      const dest = `${proto}://${host}/loom${id ? '/' + encodeURIComponent(id) : ''}`;
      let title = 'loom — a storyboard, not a drawer';
      let desc = 'Arrange filed drops into a sequence. Large files are warned, never refused. Discord unfurls /loom.';
      let image;
      if (id) {
        const rows = await sb(`looms?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
        const loom = Array.isArray(rows) ? rows[0] : null;
        const frames = loom ? await sb(`loom_frames?loom_id=eq.${encodeURIComponent(id)}&select=*&order=sort_order.asc&limit=12`) : [];
        if (loom) {
          title = `${loom.title} — loom`;
          desc = `${loom.caption || 'a sequence of filed drops'} · ${Array.isArray(frames) ? frames.length : 0} frames`;
          const first = Array.isArray(frames) ? frames.find((f) => f.share_id) : null;
          if (first && first.share_id) {
            const shares = await sb(`public_shares?id=eq.${encodeURIComponent(first.share_id)}&select=file_url,mime&limit=1`);
            const share = Array.isArray(shares) ? shares[0] : null;
            if (share && /^image\//.test(share.mime || '')) image = share.file_url;
          }
        }
      }
      if (!isBot(ua) && req.query.card !== '1') {
        res.status(302).setHeader('Location', dest);
        return res.end();
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(200).send(cardHtml({ title, desc, url: dest, image }));
    }

    if (req.method === 'GET') {
      if (!id) {
        const rows = await sb('looms?select=id,title,caption,author,accent,created_at&order=created_at.desc&limit=24');
        return res.status(200).json({ ok: true, looms: rows || [] });
      }
      const rows = await sb(`looms?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
      const loom = Array.isArray(rows) ? rows[0] : null;
      if (!loom) return res.status(404).json({ error: 'loom not found' });
      const frames = await sb(`loom_frames?loom_id=eq.${encodeURIComponent(id)}&select=*&order=sort_order.asc`);
      return res.status(200).json({ ok: true, loom, frames: frames || [] });
    }

    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const loomId = (body.id || uid()).toString().slice(0, 64);
      const title = String(body.title || 'untitled loom').slice(0, 160);
      const row = {
        id: loomId,
        title,
        caption: body.caption ? String(body.caption).slice(0, 280) : null,
        author: body.author ? String(body.author).slice(0, 80) : null,
        accent: /^#[0-9a-fA-F]{6}$/.test(body.accent || '') ? body.accent : '#0A84FF',
      };
      await sb('looms', { method: 'POST', body: JSON.stringify(row), headers: { Prefer: 'resolution=merge-duplicates,return=representation' } });
      const frames = Array.isArray(body.frames) ? body.frames.slice(0, 40) : [];
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i] || {};
        await sb('loom_frames', {
          method: 'POST',
          body: JSON.stringify({
            id: (frame.id || uid() + i).toString().slice(0, 64),
            loom_id: loomId,
            share_id: frame.shareId ? String(frame.shareId).slice(0, 64) : null,
            name: frame.name ? String(frame.name).slice(0, 180) : null,
            note: frame.note ? String(frame.note).slice(0, 240) : null,
            sort_order: i,
          }),
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        });
      }
      return res.status(200).json({ ok: true, id: loomId, path: `/loom/${loomId}` });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'loom failed' });
  }
}
