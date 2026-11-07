function esc(s) {
  const amp = String.fromCharCode(38);
  const lt = String.fromCharCode(60);
  const gt = String.fromCharCode(62);
  const q = String.fromCharCode(34);
  return String(s || '')
    .split(amp).join(amp + 'amp;')
    .split(lt).join(amp + 'lt;')
    .split(gt).join(amp + 'gt;')
    .split(q).join(amp + 'quot;');
}

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const COPY = {
  softfileharbor: ['Soft File Harbor — rankvault', 'Harbor what you carry. Multi-file local upload where each file can carry its own quiet note or share a collective caption. Soft glass surfaces rise with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  softwhisperdesk: ['Soft Whisper Desk — rankvault', 'Leave a soft whisper. Pure text notes that settle into the shared database. No file required. Soft glass cards rise with spring motion. Every link unfurls a polished Discord card. All prior desks remain fully intact. No traces of boosting.'],
  quietimageatlas: ['Quiet Image Atlas — rankvault', 'Map what you see. Drop local images. Soft glass tiles settle into a quiet atlas with spring motion. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  softecholedger: ['Soft Echo Ledger — rankvault', 'Leave an echo in the quiet ledger. A different kind of desk: chronological notes and optional local files that settle into a living ledger. Soft glass entries rise with spring motion. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  softglassriver: ['Soft Glass River — rankvault', 'Let it flow down the quiet river. Drop local files. Soft glass tiles drift downstream with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  quietorbitdesk: ['Quiet Orbit Desk — rankvault', 'Let it orbit in quiet light. Drop local files. Soft glass orbs settle and circle with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  lumengallery: ['Lumen Gallery — rankvault', 'Recent light from the desks. Browse recent public shares in a quiet gallery. Every link unfurls a polished Discord card. All prior desks remain fully intact. No traces of boosting.'],
  quietlumenorbit: ['Quiet Lumen Orbit — rankvault', 'Let it orbit in quiet light. Drop local files. Soft glass orbs settle into a living orbit with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  quietconstellation: ['Quiet Constellation — rankvault', 'Let what you carry settle among the stars. Drop local files. Soft glass stars drift and connect with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  quietstarfielddesk: ['Quiet Starfield Desk — rankvault', 'Let it settle among the stars. Drop local files. Soft glass cards drift under a quiet twinkling starfield with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  softnotesdesk: ['Soft Notes Desk — rankvault', 'Leave a quiet note. Write text, optionally attach local files. They land in storage and public_shares. Recent notes appear as soft glass cards that expand with spring motion. Every share link unfurls a polished Discord card. Large drops gently warned, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  softcollagedesk: ['Soft Collage Desk — rankvault', 'Arrange what you carry into a living collage. Drop several local files, give each a quiet caption. Soft glass tiles lift and overlap with spring motion in your accent. Shared pieces land in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  softlumenpulse: ['Soft Lumen Pulse — rankvault', 'Let it pulse with what you carry. Drop local files. Soft glass orbs breathe and rise with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops warned, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  quietlumenvault: ['Quiet Lumen Vault — rankvault', 'A still luminous place for what you carry. Drop local files. Soft glass cards rise with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops warned, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  aurorawavedesk: ['Aurora Wave Desk — rankvault', 'Ride the quiet wave with what you carry. Drop local files. Soft glass cards undulate gently like aurora waves with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops warned, never refused. Human-crafted Apple-style pacing. All prior desks remain intact.'],
  softribbondesk: ['Soft Ribbon Desk — rankvault', 'Soft ribbons of light for what you carry. Drop local files. Soft drifting ribbons settle with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops warned, never refused. Human-crafted Apple-style pacing. All prior desks remain intact.'],
  softlumenforge: ['Soft Lumen Forge — rankvault', 'Forge what you carry. Drop a local file into spectral light. Quiet note and accent. Soft glass settles with spring motion on deep navy. Lands in storage and public shares. Every link unfurls a polished Discord card. Large drops warned, never refused. Human-crafted Apple-style pacing.'],
  softprismforge: ['Soft Prism Forge — rankvault', 'A prismatic forge for what you carry. Drop local files. Soft spectral light refracts and settles with spring motion on deep navy glass. Search recent shares. Shared note, optional expiration. Every link unfurls a polished Discord card. Large drops warned, never refused. Human-crafted Apple-style pacing.'],
  lumenfold: ['Lumen Fold — rankvault', 'Fold a local file into luminous light. Title, a longer note, accent color. Soft glass folds and settles with spring motion. Lands in storage and the fold table. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softhorizon: ['Soft Horizon — rankvault', 'A quiet horizon for what you carry. Drop local files onto a still horizon. Soft light rises from the line, warm and slow. Shared note, optional expiration. Every link unfurls a polished Discord card. Large drops warned, never refused.'],
  quietechofield: ['Quiet Echo Field — rankvault', 'An echo field for what you carry. Drop one or many local files with a shared note and accent. Soft concentric echoes expand and settle. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softaurorastream: ['Soft Aurora Stream — rankvault', 'A flowing stream of light for what you carry. Drop one or many local files with a shared note and accent. Soft ribbons of light rise and settle. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softlumenorchard: ['Soft Lumen Orchard — rankvault', 'A quiet orchard for what you carry. Drop one or many local files with a shared note and accent. Soft trees of light sway and settle. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softharbor: ['Soft Harbor — rankvault', 'A quiet harbor for what you carry. Drop one or many local files with a shared note and accent. Soft waves of light lap and settle. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softprismcove: ['Soft Prism Cove — rankvault', 'A prismatic cove for what you carry. Drop one or many local files with a shared note and accent. Soft prismatic light refracts and settles. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softquietecho: ['Soft Quiet Echo — rankvault', 'An echo for what you carry. Drop one or many local files with a shared note and accent. Soft concentric echoes expand and fade. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softlumenpool: ['Soft Lumen Pool — rankvault', 'A quiet lumen pool for what you carry. Drop one or many local files with a shared note and accent. Soft ripples of light expand and settle. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softquietcove: ['Soft Quiet Cove — rankvault', 'A sheltered cove for what you carry. Drop a local file with a quiet note and accent. Soft light gathers in the cove. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  softaurorafield: ['Soft Aurora Field — rankvault', 'A quiet aurora field for what you carry. Drop a local file with title, caption, and accent. Soft light ribbons drift, pulse, and settle. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused.'],
  home: ['rankvault', 'Private file hosting and sharing. Upload local files to the database, share with professional Discord embeds. No size limits — only gentle slow warnings. Sleek Apple-style interface.'],
};

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return (x / 1024).toFixed(1) + ' KB';
  return (x / 1024 / 1024).toFixed(1) + ' MB';
}

async function loadShare(id) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,expires_at,is_public,author,caption,meta&limit=1`, {
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

module.exports = async (req, res) => {
  const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const isDiscord = ua.includes('discord');

  let title = 'rankvault — private file hosting';
  let desc = 'Upload local files to the database, share with professional Discord embeds. No hard size limits — only gentle warnings of slowness. Sleek Apple-style animations.';
  let image;
  let color = '#0A84FF';
  let shareId = null;

  if (parts.length >= 2 && ['s', 'f', 'open', 'go', 'link', 'card', 'share'].includes(parts[0])) {
    shareId = parts[1];
  } else if (parts.length === 1 && parts[0] !== 'index.html') {
    const desk = parts[0].toLowerCase();
    if (COPY[desk]) {
      title = COPY[desk][0];
      desc = COPY[desk][1];
    } else {
      title = `${desk} — rankvault`;
      desc = 'A specialized desk for files and notes. Lands in storage and public_shares. Discord unfurls a polished card. Large drops warned, never refused.';
    }
  }

  if (shareId) {
    const row = await loadShare(shareId);
    if (row && row.is_public !== false && !(row.expires_at && +new Date(row.expires_at) < Date.now())) {
      title = (row.meta && row.meta.cardTitle) || row.caption || row.name || 'Shared file — rankvault';
      desc = row.caption || `${prettySize(row.size)} · public drop on rankvault`;
      if (/^image\//.test(row.mime || '') && /^https?:\/\//i.test(row.file_url || '')) {
        image = row.file_url;
      }
      color = (row.meta && row.meta.color) || color;
    } else {
      title = 'Share — rankvault';
      desc = 'A shared file from the quiet desks. Discord unfurls a polished card.';
    }
  }

  const fullUrl = `https://${req.headers.host || 'rank-rivall.vercel.app'}${path}`;
  const html = pageHtml({ title, desc, image, url: fullUrl, color });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
};
