const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const FALLBACK = 'https://og2vsalt-svg.github.io/rank/og.png';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
}

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
}

async function fetchShare(id) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-h2aozbq4b-rivall.vercel.app';
  const path = (req.url || '/').split('?')[0].replace(/\\+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  const page = parts[0] || 'home';
  const id = parts[1] || '';

  let title = 'rankvault — private file hosting';
  let desc = 'Drop local files. Soft size warnings only. Polished Discord embeds on every link. Apple-style springs on frosted glass. Human-crafted UI.';
  let image = FALLBACK;

  if (id && (page === 's' || page === 'share' || page === 'f' || page === 'open' || page === 'go' || page === 'link')) {
    const share = await fetchShare(id);
    if (share) {
      title = (share.name || 'shared file') + ' — rankvault';
      desc = (share.caption || 'shared via rankvault') + ' · ' + prettySize(share.size);
      if (String(share.mime || '').startsWith('image/') && /^https?:/i.test(share.file_url || '')) {
        image = share.file_url;
      }
    }
  } else if (page === 'library') {
    title = 'Library — rankvault';
    desc = 'Browse recent public shares with search and filters. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'drop') {
    title = 'Drop — rankvault';
    desc = 'The clean central place to share local files. Soft size warnings only. Polished Discord embeds on every link. Apple-style springs.';
  } else if (page === 'studio') {
    title = 'Studio — rankvault';
    desc = 'Compose a share: drop local files, add quiet notes, choose an accent, and publish permanent links. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'board') {
    title = 'Board — rankvault';
    desc = 'Pin notes and files on a quiet board, then publish the whole as one share. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'twilight') {
    title = 'Twilight Desk — rankvault';
    desc = 'Drop a local file, choose a cool indigo accent, add a quiet caption, and publish a permanent share. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'sunrise') {
    title = 'Sunrise Desk — rankvault';
    desc = 'Drop a local file, choose a warm accent, add a quiet caption, and publish a permanent share. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'journal') {
    title = 'Journal — rankvault';
    desc = 'Date a quiet entry, write freely, optionally attach a photo or file, and publish a permanent share. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'gradient') {
    title = 'Gradient — rankvault';
    desc = 'Compose a linear gradient, preview it live, and publish the image as a permanent share. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'gallery') {
    title = 'Gallery — rankvault';
    desc = 'Recent public shares, presented quietly. Soft size warnings only. Polished Discord embeds.';
  } else if (page === 'explore') {
    title = 'Explore — rankvault';
    desc = 'Visual explorer of public shares with search, filters, and sorts. Apple-style springs. Soft warnings only. Polished Discord embeds.';
  } else if (page === 'sketch') {
    title = 'Sketch Desk — rankvault';
    desc = 'Draw on a quiet canvas and publish the image as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.';
  } else if (page === 'notestudio') {
    title = 'Note Studio — rankvault';
    desc = 'Write quiet notes that become shareable files. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'qrdesk') {
    title = 'QR Desk — rankvault';
    desc = 'Generate real QR codes from any link and publish them as permanent shares. Polished Discord embeds. Soft warnings only.';
  } else if (page === 'snippet') {
    title = 'Snippet Desk — rankvault';
    desc = 'Share code and text snippets that become permanent files with polished Discord embeds. Soft size warnings only. Apple-style springs.';
  } else if (page === 'chroma') {
    title = 'Chroma Desk — rankvault';
    desc = 'Compose color palettes and publish them as clean image shares. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'collage') {
    title = 'Collage Desk — rankvault';
    desc = 'Arrange images into a quiet collage and publish it as a permanent share. Soft size warnings only. Polished Discord embeds.';
  } else if (page === 'moment') {
    title = 'Moment — rankvault';
    desc = 'Share a quiet moment — text, image, or both — as a permanent link with polished Discord embeds. Soft size warnings only. Apple-style springs.';
  } else if (page === 'pulse') {
    title = 'Pulse — rankvault';
    desc = 'Quiet activity of recent shares. Soft springs. Polished embeds. No hard limits.';
  } else if (page === 'countdown') {
    title = 'Countdown — rankvault';
    desc = 'Set a quiet future moment and share a living countdown. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'links') {
    title = 'Links Desk — rankvault';
    desc = 'Collect quiet links with notes and publish them as a permanent share. Soft warnings only. Polished Discord embeds.';
  } else if (page === 'insights') {
    title = 'Insights — rankvault';
    desc = 'Quiet numbers on recent public shares: types, sizes, and arrivals. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  }

  const url = `${proto}://${host}${path}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#0A84FF"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:56px 24px;text-align:center"><p style="opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
