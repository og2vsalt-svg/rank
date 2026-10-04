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
  const dest = origin + '/' + (page || 'bowsprit') + (id ? '/' + encodeURIComponent(id) : '');

  let card = {
    title: page === 'chainplate' ? 'chainplate — a load, not a drawer' : 'bowsprit — a forward, not a drawer',
    desc: 'A local file lands in the share table. Large drops are warned, never refused.',
    url: dest,
    color: page === 'chainplate' ? '#FF9F0A' : '#64D2FF',
  };

  if (page === 'bowsprit' && id) {
    const row = await sbGet(`bowsprits?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const share = row && row.share_id ? await sbGet(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=mime,file_url,size&limit=1`) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    card = {
      title: row ? `${row.port} — bowsprit` : 'bowsprit — rankvault',
      desc: row ? `${row.eta_note || row.note || 'a forward'}${row.file_name ? ' · ' + row.file_name : ''} · ${prettySize(row.size)}` : 'a named port and a local file. not a drawer.',
      image,
      url: dest,
      color: '#64D2FF',
    };
  }

  if (page === 'chainplate' && id) {
    const row = await sbGet(`chainplates?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const share = row && row.share_id ? await sbGet(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=mime,file_url&limit=1`) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    card = {
      title: row ? `${row.load_line} — chainplate` : 'chainplate — rankvault',
      desc: row ? `${row.other_end ? 'other end ' + row.other_end + ' · ' : ''}${row.note || 'a load beside a filed file'} · ${prettySize(row.size)}` : 'a load line, not a drawer.',
      image,
      url: dest,
      color: '#FF9F0A',
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
