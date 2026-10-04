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
    .replace(/"/g, amp + 'quot;')
    .replace(/'/g, amp + '#39;');
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider|redditbot|applebot|discordbot|iframely|unfurl|pinterest|notion|teams|slack-imgproxy/i.test(ua || '');
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

const PAGE_TITLES = { ...EXTRA_TITLES };
const PAGE_DESC = { ...EXTRA_DESC };

function pageHtml({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="${esc(c)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(safeImg)}" /><meta property="og:image:secure_url" content="${esc(safeImg)}" /><meta property="og:image:alt" content="${esc(title)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(safeImg)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
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
  const parcel = (req.query.parcel || '').toString().trim();
  const ask = (req.query.ask || '').toString().trim();
  const receipt = (req.query.receipt || '').toString().trim();
  const pin = (req.query.pin || '').toString().trim();
  const check = (req.query.check || '').toString().trim();
  const room = (req.query.room || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = req.headers['user-agent'];

  if (page === 'rider' && id) {
    const row = await sbGet(`riders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/rider/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.timber} — rider` : 'rider — rankvault',
      desc: row ? `${row.note ? row.note + ' · ' : ''}${share ? prettySize(share.size) + ' · ' : ''}a brace, not a drawer` : 'a timber note beside a filed file.',
      image,
      url: dest,
      color: '#FF9F0A',
    });
    return;
  }
  if (page === 'scupper' && id) {
    const row = await sbGet(`scupper_drips?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/scupper/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.drain} — scupper` : 'scupper — rankvault',
      desc: row ? `${row.where_to ? 'to ' + row.where_to + ' · ' : ''}${share ? prettySize(share.size) + ' · ' : ''}a drain, not a drawer` : 'a drain note beside a filed file.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page && !id) {
    const dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: PAGE_TITLES[page] || `${page} — rankvault`,
      desc: PAGE_DESC[page] || 'quiet file hosting. discord cards on every link.',
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (!id) {
    res.status(302).setHeader('Location', '/');
    res.end();
    return;
  }
  const row = await loadShare(id);
  const live = row && row.is_public && (!row.expires_at || +new Date(row.expires_at) > Date.now());
  const appUrl = `${proto}://${host}/#share?f=${encodeURIComponent(id)}`;
  const image = live && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
  sendCard(res, ua, req.query.embed, appUrl, {
    title: live ? ((row.meta && row.meta.cardTitle) || row.name) : 'rankvault drop',
    desc: live ? `${prettySize(row.size)} · public drop on rankvault` : 'a quiet file drop. open to download.',
    image,
    url: appUrl,
    color: (live && row.meta && row.meta.color) || '#0A84FF',
  });
}
