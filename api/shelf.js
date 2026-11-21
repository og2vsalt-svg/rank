const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const FALLBACK = 'https://og2vsalt-svg.github.io/rank/og.png';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const path = (req.url || '/').split('?')[0].replace(/\\/+$/, '') || '/';
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
  } else if (page === 'signal') {
    title = 'Signal — rankvault';
    desc = 'Live feed of recent public shares. Quick note or file compose. Polished Discord embeds. Soft size warnings only. Apple-style springs.';
  } else if (page === 'stillpath') {
    title = 'Stillpath — rankvault';
    desc = 'A quiet path for local files. They settle one by one with a shared note. Polished Discord embeds. Soft size warnings only.';
  } else if (page === 'quietstream') {
    title = 'Quietstream — rankvault';
    desc = 'Drop a local file into the quiet stream of recent shares. Polished Discord embeds. Soft size warnings only.';
  } else if (page === 'stillwater') {
    title = 'Stillwater — rankvault';
    desc = 'Calm reflective surface for a single drop. Gentle ripples on contact. Soft size warnings only. Polished Discord embeds.';
  } else if (page === 'focus') {
    title = 'Focus — rankvault';
    desc = 'A focused single-file drop with live preview. Soft size warnings only. Polished Discord embeds.';
  } else if (page === 'mosaic') {
    title = 'Mosaic — rankvault';
    desc = 'Compose a visual grid of local files with shared title and per-tile notes. One accent color. Polished Discord embeds. Soft size warnings only.';
  } else if (page === 'hub') {
    title = 'Hub — rankvault';
    desc = 'Central drop for local files. Browse recent shares. Polished Discord embeds. Soft size warnings only.';
  } else if (page === 'workshop') {
    title = 'Workshop — rankvault';
    desc = 'Multi-file drops with notes and accents. Polished Discord embeds on every link. Soft size warnings only.';
  } else if (page === 'nexus') {
    title = 'Nexus — rankvault';
    desc = 'Central file hub. Drop, browse recent shares, publish with Discord-ready links. Soft size warnings only.';
  } else if (page === 'core') {
    title = 'Core — rankvault';
    desc = 'The cleanest drop. Soft size warnings only. No hard limits.';
  } else if (page === 'aetherpulse') {
    title = 'Aether Pulse — rankvault';
    desc = 'Pulse local files with per-item notes and accents. A thread binds them. Polished Discord embeds. Soft size warnings only.';
  } else if (page === 'lumen') {
    title = 'Lumen — rankvault';
    desc = 'Public gallery of recent shares. Professional Discord unfurls. Soft warnings only.';
  } else if (page === 'canvas') {
    title = 'Canvas — rankvault';
    desc = 'Arrange files with captions. Floating accents. Discord-ready links.';
  } else if (page === 'solace') {
    title = 'Solace — rankvault';
    desc = 'A quiet place to leave a file and a short note. Polished Discord embeds. Soft size warnings only.';
  } else if (page === 'quill') {
    title = 'Quill — rankvault';
    desc = 'Write quietly. Publish a note as a shareable text drop with a polished Discord embed. Soft size warnings only.';
  } else if (page === 'collection') {
    title = 'Collection — rankvault';
    desc = 'Browse and search recent public shares. Soft size warnings only. Polished Discord embeds on every link.';
  } else if (page === 'orbit') {
    title = 'Orbit — rankvault';
    desc = 'Files circle a binding note. Per-item notes, accent color, polished Discord embeds. Soft size warnings only.';
  } else if (page === 'cascade') {
    title = 'Cascade — rankvault';
    desc = 'Soft falling multi-file drop with shared note and drifting accent lines. Polished Discord embeds.';
  } else if (page === 'zenith') {
    title = 'Zenith — rankvault';
    desc = 'Ascend files to the highest point. Peak note, accent, polished Discord embeds. Soft warnings only.';
  } else if (page === 'nimbus') {
    title = 'Nimbus — rankvault';
    desc = 'Soft cloud drop. Files settle as rising mist. Shared caption and accent. Discord-ready links.';
  } else if (page === 'directory') {
    title = 'Desks — rankvault';
    desc = 'Every specialized surface for private file hosting. Soft size warnings only. Polished Discord embeds.';
  } else if (page === 'notesvault') {
    title = 'Notes Vault — rankvault';
    desc = 'Write a quiet note or attach files. Pure text becomes a shareable file. Polished Discord embeds. Soft size warnings only.';
  } else if (page === 'softmist') {
    title = 'SoftMist — rankvault';
    desc = 'Files settle into soft mist around a shared note. Polished Discord embeds. Soft size warnings only.';
  } else if (page === 'quietthread') {
    title = 'QuietThread — rankvault';
    desc = 'A quiet thread of notes and optional files. Each share carries a polished Discord embed. Soft warnings only.';
  } else if (page === 'driftlight') {
    title = 'DriftLight — rankvault';
    desc = 'A single file under drifting light. Polished Discord embeds. Soft size warnings only.';
  }

  const url = `${proto}://${host}${path}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#0A84FF"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:56px 24px;text-align:center"><p style="opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
