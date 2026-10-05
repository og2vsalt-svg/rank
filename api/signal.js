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

async function sbGet(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

function html({ title, desc, url, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#0A84FF" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(img)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(img)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.08em;text-transform:uppercase;font-size:13px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

const COPY = {
  luff: ['luff — a sail angle, not a drawer', 'Set a heading, write the wind, and hand a local file to the share table. Discord unfurls /luff and /s. Large files are warned, never refused.'],
  ketch: ['ketch — two masts, not a drawer', 'Two local files, one sentence on which mast carries what. Discord unfurls /ketch and each /s. Large files are warned, never refused.'],
  beacon: ['beacon — a lit signal, not a drawer', 'Light a line with an optional fade time and an optional local file. Discord unfurls /beacon and /s. Large files are warned, never refused.'],
};

export default async function handler(req, res) {
  const page = String(req.query.page || 'luff').toLowerCase();
  const id = String(req.query.id || '').trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const dest = `${proto}://${host}/${page}${id ? '/' + encodeURIComponent(id) : ''}`;
  const ua = String(req.headers['user-agent'] || '');
  const bot = /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|iframely|bot|crawler|spider/i.test(ua);
  let title = (COPY[page] || [`${page} — rankvault`, 'quiet file hosting.'])[0];
  let desc = (COPY[page] || ['', 'quiet file hosting. discord cards on every link.'])[1];
  let image;
  if (id && page === 'luff') {
    const row = await sbGet(`luffs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (row) {
      title = `${row.heading} — luff`;
      desc = `${row.wind ? row.wind + ' · ' : ''}${row.note || 'a sail angle beside a filed file'}`;
      if (row.share_id) {
        const share = await sbGet(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=mime,file_url&limit=1`);
        if (share && String(share.mime || '').startsWith('image/')) image = share.file_url;
      }
    }
  }
  if (id && page === 'ketch') {
    const row = await sbGet(`ketches?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (row) {
      title = `${row.main_name || 'main'} / ${row.mizzen_name || 'mizzen'} — ketch`;
      desc = row.sentence || 'two masts, one sentence.';
    }
  }
  if (id && page === 'beacon') {
    const row = await sbGet(`beacons?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (row) {
      title = `${row.signal} — beacon`;
      desc = row.fade_at ? `lit until ${new Date(row.fade_at).toUTCString()}` : 'a lit signal. the fade time is a note, not a lock.';
    }
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
