const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const FALLBACK = 'https://og2vsalt-svg.github.io/rank/og.png';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\"/g, '"')
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
  const path = (req.url || '/').split('?')[0].replace(/\/+$/, '') || '/';
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
  } else if (page === 'eclipsedesk') {
    title = 'Eclipse Desk — rankvault';
    desc = 'Files rise like stars. Sequential multi-file shares under one quiet title and caption with staggered springs. Soft size warnings only. Permanent Discord-ready links. Apple-style frosted glass.';
  } else if (page === 'prismcascade') {
    title = 'Prism Cascade — rankvault';
    desc = 'Files rise in sequential prism colors. Multi-file drops cascade into permanent Discord-ready shares. Soft size warnings only. Apple-style springs on frosted glass.';
  } else if (page === 'canvasdesk') {
    title = 'Canvas Desk — rankvault';
    desc = 'A quiet place for images. Live preview, title, caption, and accent. Permanent Discord-ready link. Soft size warnings only. Apple-style springs.';
  } else if (page === 'quietweave') {
    title = 'Quiet Weave — rankvault';
    desc = 'Weave short notes and an optional local file into one clean share. Polished Discord embeds. Soft warnings only. Apple-style springs on frosted glass.';
  } else if (page === 'forge') {
    title = 'Forge — rankvault';
    desc = 'Craft a polished share from a local file. Shape title, caption, and accent. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'aureateforge') {
    title = 'Aureate Forge — rankvault';
    desc = 'Gilded shares in warm light. Shape title, caption, and golden accent. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'velvetdesk') {
    title = 'Velvet Desk — rankvault';
    desc = 'Soft, lasting shares in deep velvet. Shape title, caption, and rich accent. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'quietharbor') {
    title = 'Quiet Harbor — rankvault';
    desc = 'A calm place to leave files. Soft size warnings only. Polished Discord embeds on every link. Apple-style springs.';
  } else if (page === 'library') {
    title = 'Library — rankvault';
    desc = 'Browse recent public shares with search and filters. Soft size warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'drop') {
    title = 'Drop — rankvault';
    desc = 'The clean central place to share local files. Soft size warnings only. Polished Discord embeds on every link. Apple-style springs.';
  } else if (page === 'orbitdesk') {
    title = 'Orbit Desk — rankvault';
    desc = 'Ideas in orbit. Map a center and surrounding thoughts, then publish as a clean markdown share. Soft warnings only. Polished Discord embeds. Apple-style springs.';
  } else if (page === 'centraldrop') {
    title = 'Central Drop — rankvault';
    desc = 'Everything in one place. Multi-file drops cascade into permanent shares with polished Discord embeds. Soft size warnings only. Apple-style springs.';
  } else if (page === 'horizondesk') {
    title = 'Horizon Desk — rankvault';
    desc = 'Where shares meet the light. Multi-file drops settle along a quiet horizon. Soft warnings only. Polished Discord embeds.';
  } else if (page === 'constellation') {
    title = 'Constellation — rankvault';
    desc = 'Place a central idea and orbiting notes or files. Publish the whole constellation as a clean markdown share. Soft size warnings only. Polished Discord embeds.';
  } else if (page === 'lattice') {
    title = 'Lattice — rankvault';
    desc = 'Arrange notes and files in a quiet grid. Publish the lattice as structured markdown with embeds. Soft warnings only. Apple-style springs.';
  } else if (page === 'gossamerdesk') {
    title = 'Gossamer Desk — rankvault';
    desc = 'Delicate multi-file shares with soft notes and muted accents. Each local file settles as its own permanent Discord-ready link. Soft size warnings only. Apple-style springs on frosted glass.';
  }

  const url = `${proto}://${host}${path}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#0A84FF"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:56px 24px;text-align:center"><p style="opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
