const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&' + 'amp;')
    .replace(/</g, '&' + 'lt;')
    .replace(/>/g, '&' + 'gt;')
    .replace(/"/g, '&' + 'quot;');
}

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider|redditbot|applebot|discordbot|iframely|unfurl|pinterest|notion|teams|slack-imgproxy/i.test(ua || '');
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

function pageHtml({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="${esc(c)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(safeImg)}" /><meta property="og:image:secure_url" content="${esc(safeImg)}" /><meta property="og:image:alt" content="${esc(title)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(safeImg)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  const page = (req.query.page || '').toString().trim().toLowerCase();
  const id = (req.query.id || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app').toString();
  const ua = req.headers['user-agent'] || '';
  const origin = `${proto}://${host}`;

  let card = {
    title: 'rankvault',
    desc: 'quiet file hosting. large drops are warned, never refused.',
    url: origin + '/',
    color: '#0A84FF',
  };
  let dest = origin + '/';

  if (page === 'gammon') {
    dest = origin + '/gammon' + (id ? '/' + encodeURIComponent(id) : '');
    const row = id ? await sbGet(`public_shares?id=eq.${encodeURIComponent(id)}&select=name,mime,size,file_url,caption,meta&limit=1`) : null;
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    card = {
      title: row ? `${row.name} — gammon` : 'gammon — a room, not a drawer',
      desc: row ? `${row.caption || 'a file in the room'} · ${prettySize(row.size)}` : 'Drop a local file into the public room. Discord unfurls /gammon and /s.',
      image,
      url: dest,
      color: (row && row.meta && row.meta.color) || '#0A84FF',
    };
  } else if (page === 'cathead') {
    dest = origin + '/cathead' + (id ? '/' + encodeURIComponent(id) : '');
    const row = id ? await sbGet(`links?id=eq.${encodeURIComponent(id)}&select=url,note,author&limit=1`) : null;
    card = {
      title: row ? `${row.note || row.url} — cathead` : 'cathead — an address, not a drawer',
      desc: row ? row.url : 'Pin an address on the spar. Not a file cabinet. Discord unfurls /cathead.',
      url: dest,
      color: '#64D2FF',
    };
  } else if (id) {
    dest = origin + '/s/' + encodeURIComponent(id);
    const row = await sbGet(`public_shares?id=eq.${encodeURIComponent(id)}&select=name,mime,size,file_url,caption,meta,author&limit=1`);
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    card = {
      title: row ? row.name : 'shared file — rankvault',
      desc: row ? `${row.caption || row.author || 'a public drop'} · ${prettySize(row.size)}` : 'a public drop. large files are warned, never refused.',
      image,
      url: dest,
      color: (row && row.meta && row.meta.color) || '#0A84FF',
    };
  }

  if (!isBot(ua) && req.query.embed !== '1') {
    res.status(302).setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(pageHtml(card));
}
