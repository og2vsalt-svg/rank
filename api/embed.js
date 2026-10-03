import { EXTRA_TITLES, EXTRA_DESC } from '../lib/deskCards.js';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  const amp = String.fromCharCode(38);
  return String(s || '')
    .replace(/&/g, amp + 'amp;')
    .replace(/</g, amp + 'lt;')
    .replace(/>/g, amp + 'gt;')
    .replace(/\"/g, amp + 'quot;')
    .replace(/'/g, amp + '#39;');
}

function isBot(ua) {
  const u = (ua || '').toLowerCase();
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider|redditbot|applebot|discordbot|iframely|unfurl|valve|steam|pinterest|notion|teams|slack-imgproxy/.test(u);
}

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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

async function loadShare(id) {
  return sbGet(`public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,expires_at,is_public,author,download_count,meta,caption&limit=1`);
}

const PAGE_TITLES = {
  ...EXTRA_TITLES,
  sounding: 'sounding — a reading, not a drawer',
  marline: 'marline — a log line, not a drawer',
  folio: 'folio — a local file, filed',
  deadeye: 'deadeye — a witness, not a drawer',
  hounds: 'hounds — a line, not a drawer',
};
const PAGE_DESC = { ...EXTRA_DESC };

function pageHtml({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="${esc(c)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(safeImg)}" /><meta property="og:image:secure_url" content="${esc(safeImg)}" /><meta property="og:image:alt" content="${esc(title)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(safeImg)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p><script>if(!/discord|bot|embed|preview/i.test(navigator.userAgent||'')) location.replace(${JSON.stringify(url)});</script></body></html>`;
}

function sendCard(res, ua, embedFlag, dest, card) {
  if (!isBot(ua) && embedFlag !== '1') {
    res.status(302).setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(pageHtml(card));
}

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || '').toString().trim().toLowerCase();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = req.headers['user-agent'];

  if (page === 'sounding' && id) {
    const row = await sbGet(`soundings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/sounding/${encodeURIComponent(id)}`;
    const title = row ? `${row.ok ? 'answered' : 'no answer'} — sounding` : 'sounding — rankvault';
    const desc = row ? `${row.target} · ${row.status_code || 0} · ${row.elapsed_ms || 0} ms` : 'a reading, not a drawer.';
    sendCard(res, ua, req.query.embed, dest, { title, desc, url: dest, color: '#64D2FF' });
    return;
  }

  if (page === 'marline' && id) {
    const row = await sbGet(`marlines?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/marline/${encodeURIComponent(id)}`;
    const title = row ? `${row.watch} watch — ${row.name}` : 'marline — rankvault';
    const desc = row ? `${row.entry} · ${prettySize(row.size)}` : 'a log line and a file. not a drawer.';
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, { title, desc, image, url: dest, color: '#30D158' });
    return;
  }

  if (page === 'deadeye' && id) {
    const row = await sbGet(`deadeyes?id=eq.${encodeURIComponent(id)}&select=id,witness,saw,name,mime,size,author,file_url&limit=1`);
    const dest = `${proto}://${host}/deadeye/${encodeURIComponent(id)}`;
    const title = row ? `${row.witness} — ${row.name}` : 'deadeye — rankvault';
    const desc = row ? `${row.saw} · ${prettySize(row.size)}` : 'a witness and a file. not a drawer.';
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, { title, desc, image, url: dest, color: '#64D2FF' });
    return;
  }

  if (page && !id) {
    const dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    const title = PAGE_TITLES[page] || `${page} — rankvault`;
    const desc = PAGE_DESC[page] || 'quiet file hosting. drop a file, share only if you want. discord cards on every link.';
    sendCard(res, ua, req.query.embed, dest, { title, desc, url: dest, color: '#0A84FF' });
    return;
  }

  const appUrl = `${proto}://${host}/#share?f=${encodeURIComponent(id)}`;
  if (!id) {
    res.status(302).setHeader('Location', '/');
    res.end();
    return;
  }
  const row = await loadShare(id);
  const live = row && row.is_public && (!row.expires_at || +new Date(row.expires_at) > Date.now());
  const title = live ? ((row.meta && row.meta.cardTitle) || row.name) : 'rankvault drop';
  const kind = live && row.mime ? String(row.mime).split(';')[0] : 'file';
  const caption = live ? String((row.meta && row.meta.caption) || row.caption || '') : '';
  const desc = live ? `${caption ? caption + ' · ' : ''}${kind} · ${prettySize(row.size)} · public drop on rankvault` : 'a quiet file drop. open to download.';
  const mime = String((live && row.mime) || '');
  const fileUrl = String((live && row.file_url) || '');
  const image = live && mime.startsWith('image/') && /^https?:\/\//i.test(fileUrl) ? fileUrl : undefined;
  sendCard(res, ua, req.query.embed, appUrl, { title, desc, image, url: appUrl, color: '#0A84FF' });
}
