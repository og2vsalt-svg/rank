const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function isBot(ua) {
  const u = (ua || '').toLowerCase();
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider/.test(u);
}

function pageHtml({ title, desc, image, url, color }) {
  const img = image || 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta name="theme-color" content="${esc(color)}" />
<meta name="robots" content="noindex" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="rankvault" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(img)}" />
<meta property="og:image:secure_url" content="${esc(img)}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(title)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(img)}" />
<link rel="canonical" href="${esc(url)}" />
<meta http-equiv="refresh" content="0;url=${esc(url)}" />
</head>
<body style="background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif">
<p>opening drop… <a href="${esc(url)}">continue</a></p>
</body>
</html>`;
}

async function loadShare(id) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,expires_at,is_public&limit=1`;
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

const PAGE_TITLES = {
  vault: 'vault — rankvault',
  foyer: 'foyer — rankvault',
  meridian: 'meridian — rankvault',
  lintel: 'lintel — rankvault',
  quorum: 'quorum — rankvault',
  barrow: 'barrow — rankvault',
  terrace: 'terrace — rankvault',
  quarry: 'quarry — rankvault',
  aperture: 'aperture — rankvault',
  vellum: 'vellum — rankvault',
  silo: 'silo — rankvault',
  halo: 'halo — rankvault',
  annex: 'annex — rankvault',
  marble: 'marble — rankvault',
  quartz: 'quartz — rankvault',
  ivory: 'ivory — rankvault',
  amber: 'amber — rankvault',
  pebble: 'pebble — rankvault',
  cedar: 'cedar — rankvault',
  rift: 'rift — rankvault',
  loft: 'loft — rankvault',
  reed: 'reed — rankvault',
  brook: 'brook — rankvault',
  vale: 'vale — rankvault',
  hearth: 'hearth — rankvault',
  harbor: 'harbor — rankvault',
  parcel: 'parcel — rankvault',
  atlas: 'atlas — rankvault',
  studio: 'studio — rankvault',
  whisper: 'whisper — rankvault',
  glide: 'glide — rankvault',
  drop: 'drop — rankvault',
  transfer: 'transfer — rankvault',
  notes: 'notes — rankvault',
  paste: 'paste — rankvault',
  well: 'well — rankvault',
  onyx: 'onyx — rankvault',
  bridge: 'bridge — rankvault',
  json: 'json desk — rankvault',
  board: 'board — rankvault',
  stash: 'stash — rankvault',
  snapshot: 'snapshot — rankvault',
  sketch: 'sketch — rankvault',
  echo: 'echo — rankvault',
  loom: 'loom — rankvault',
  split: 'split — rankvault',
  beacon: 'beacon — rankvault',
  weave: 'weave — rankvault',
  aura: 'aura — rankvault',
  cipher: 'cipher — rankvault',
  prism: 'prism — rankvault',
  flux: 'flux — rankvault',
  orbit: 'orbit — rankvault',
  signal: 'signal — rankvault',
  tidy: 'tidy — rankvault',
  quay: 'quay — rankvault',
  lens: 'lens — rankvault',
  drift: 'drift — rankvault',
  compass: 'compass — rankvault',
  keep: 'keep — rankvault',
  folio: 'folio — rankvault',
  relay: 'relay — rankvault',
  mirror: 'mirror — rankvault',
  shelf: 'shelf — rankvault',
  reel: 'reel — rankvault',
  pact: 'pact — rankvault',
  wick: 'wick — rankvault',
  nexus: 'nexus — rankvault',
  veil: 'veil — rankvault',
  convert: 'convert — rankvault',
  qr: 'qr — rankvault',
  clip: 'clip — rankvault',
  hash: 'hash — rankvault',
  palette: 'palette — rankvault',
  pulse: 'pulse — rankvault',
  diff: 'diff — rankvault',
  timer: 'timer — rankvault',
  inspect: 'inspect — rankvault',
  zip: 'zip — rankvault',
  links: 'links — rankvault',
  markdown: 'markdown — rankvault',
  gallery: 'gallery — rankvault',
  record: 'record — rankvault',
  count: 'count — rankvault',
  units: 'units — rankvault',
  status: 'status — rankvault',
  login: 'log in — rankvault',
  signup: 'sign up — rankvault',
  mica: 'mica — rankvault',
  dune: 'dune — rankvault',
  fog: 'fog — rankvault',
  pine: 'pine — rankvault',
  opal: 'opal — rankvault',
  shore: 'shore — rankvault',
  canopy: 'canopy — rankvault',
  wisp: 'wisp — rankvault',
  solstice: 'solstice — rankvault',
  nimbus: 'nimbus — rankvault',
  stride: 'stride — rankvault',
  glint: 'glint — rankvault',
};

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();

  if (page && !id) {
    const dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    const title = PAGE_TITLES[page] || `${page} — rankvault`;
    const desc = 'quiet file hosting and side desks. share only if you want.';
    if (!isBot(req.headers['user-agent']) && req.query.embed !== '1') {
      res.status(302).setHeader('Location', dest);
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(pageHtml({ title, desc, image: undefined, url: dest, color: '#0a84ff' }));
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
  const title = live ? `${row.name} — rankvault` : 'rankvault drop';
  const desc = live
    ? `${row.mime || 'file'} · ${Math.round((Number(row.size) || 0) / 1024)} kb · quiet public drop`
    : 'a quiet file drop. open to download.';
  const image = live && String(row.mime || '').startsWith('image/') ? row.file_url : undefined;

  if (!isBot(req.headers['user-agent']) && req.query.embed !== '1') {
    res.status(302).setHeader('Location', appUrl);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(pageHtml({ title, desc, image, url: appUrl, color: '#0a84ff' }));
}
