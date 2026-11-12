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

const FALLBACK = 'https://og2vsalt-svg.github.io/rank/og.png';

const COPY = {
  quietgrove: ["Quiet Grove — rankvault", "Plant what you carry in a quiet grove. Drop local files. Soft frosted glass trees grow and gently sway with spring motion. Shared caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quiethelix: ["Quiet Helix — rankvault", "Spiral what you carry into a quiet helix. Drop local files. Soft rotating glass beads drift and settle with spring motion on frosted glass. Shared caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietlantern: ["Quiet Lantern — rankvault", "Hang what you carry as soft glowing lanterns. Drop local files. They settle into floating glass lanterns with gentle pulsing light and spring motion on frosted glass. Shared caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietvesper: ["Quiet Vesper — rankvault", "Drop local files into the soft dusk of vesper. They rise as gentle floating lanterns of frosted glass with spring motion. Share one caption and warm accent, then publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietnexus: ["Quiet Nexus — rankvault", "A still center where shared files gather as soft points of light. Drop any local files to place them into storage and the public record. Gentle orbital motion, glass surfaces, polished Discord embeds on every link. Large files warned, never refused. Human-crafted Apple-style interface."],
  quietfolio: ["Quiet Folio — rankvault", "Gather local files into a soft folio. Image previews, spring-animated frosted glass cards, shared caption and accent. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  lumengallery: ["Lumen Gallery — rankvault", "Soft light on shared images. Tap any piece to expand with spring motion on frosted glass. Professional Discord embeds on every link. All prior desks remain fully intact. No traces of boosting. Human-crafted Apple-style pacing."],
  softecho: ["Soft Echo — rankvault", "Leave a quiet line. It settles into the public stream with soft spring motion. No accounts required. Discord embeds on every link. All prior features stay. Human-crafted Apple-style interface."],
  softquietbrook: ["Soft Quiet Brook — rankvault", "Let files flow gently downstream. Drop local files into a soft quiet brook. Shared caption and cool accent. Soft flowing light and spring motion on frosted glass. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietnimbus: ["Soft Quiet Nimbus — rankvault", "Files drift in soft light. Drop several local files. They share one quiet caption and accent as they upload to storage and public_shares. Soft floating orbs, spring motion on frosted glass. Each link unfurls a polished Discord embed. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietobservatory: ["Soft Quiet Observatory — rankvault", "Observe what you carry under the dome. Drop local files into a quiet glass observatory. Each star can hold its own note or share a dome caption and accent. Soft orbs drift and settle with spring motion on frosted glass. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietdawn: ["Soft Quiet Dawn — rankvault", "Let the light rise on what you carry. Drop local files into the soft light of dawn. Each piece can hold its own quiet note and its own dawn accent. Soft gradients rise and settle with spring motion on frosted glass. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietchamber: ["Soft Quiet Chamber — rankvault", "Settle what you carry into a quiet chamber. Multi-file local upload where each file can hold its own quiet note or share a chamber caption and accent. Soft glass panels float and settle with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietmeadow: ["Soft Quiet Meadow — rankvault", "Let it bloom in the meadow. Drop local files into a quiet meadow of soft glass flowers. Each bloom can hold its own note or share a meadow caption and accent. They rise and gently sway with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietveil: ["Soft Quiet Veil — rankvault", "Let it settle behind the veil. Drop local files behind a soft veil of light. Each piece can hold its own quiet note or share a veil caption and accent. Soft translucent layers drift and settle with spring motion on frosted glass. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietlumenbridge: ['Quiet Lumen Bridge — rankvault', 'Bridge what you carry across quiet light. Multi-file local upload where soft glass pillars rise and connect with luminous lines that spring into place. Each file can hold its own quiet note or share a bridge caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  softquietconstellation: ["Soft Quiet Constellation — rankvault", "Connect what you carry among the stars. Drop local files into a quiet constellation. Soft glass stars drift and link with luminous lines that spring into place. Each can hold its own note or share a constellation caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style spring motion. All prior desks remain fully intact. No traces of boosting."],
  home: ['rankvault', 'Private file hosting and sharing. Upload local files to the database, share with professional Discord embeds. No size limits — only gentle slow warnings. Sleek Apple-style interface. Quiet Folio, Quiet Grove, Quiet Vesper, Quiet Nexus, and dozens of specialized desks.'],
};

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  if (x < 1073741824) return (x / 1048576).toFixed(1) + ' MB';
  return (x / 1073741824).toFixed(2) + ' GB';
}

async function getShare(id) {
  if (!id) return null;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-rivall.vercel.app');
  const original = String(req.headers['x-vercel-original-url'] || req.url || '/');
  const path = original.split('?')[0].replace(/^\/+/, '').toLowerCase();
  const parts = path.split('/').filter(Boolean);
  const page = parts[0] || 'home';
  const id = parts[1] || '';

  let title = 'rankvault';
  let desc = 'Private file hosting and sharing. Professional Discord embeds on every link. Soft size warnings only. Sleek Apple-style interface.';
  let image = FALLBACK;
  let color = '#0A84FF';

  if (COPY[page]) {
    title = COPY[page][0];
    desc = COPY[page][1];
  }

  if ((page === 's' || page === 'share' || page === 'open') && id) {
    const share = await getShare(id);
    if (share && share.is_public !== false) {
      title = (share.meta && share.meta.cardTitle) || share.name || 'shared file';
      desc = (share.caption || 'shared from rankvault') + ' · ' + prettySize(share.size);
      if (String(share.mime || '').startsWith('image/') && /^https?:/i.test(share.file_url || '')) {
        image = share.file_url;
      }
      if (share.meta && share.meta.color) color = share.meta.color;
    }
  }

  const url = proto + '://' + host + '/' + (path || '');
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><meta name="theme-color" content="' + esc(color) + '"><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(image) + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="' + esc(url) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '"><meta name="twitter:image" content="' + esc(image) + '"></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:56px 24px"><p style="opacity:.5;letter-spacing:.08em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em">' + esc(title) + '</h1><p style="color:#a1a1aa">' + esc(desc) + '</p></body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
}
