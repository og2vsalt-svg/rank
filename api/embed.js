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
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider|redditbot|applebot|discordbot|iframely|unfurl|valve|steam/.test(u);
}

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' b';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' kb';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' mb';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function pageHtml({ title, desc, image, url, color, mime }) {
  const img = image || 'https://og2vsalt-svg.github.io/rank/og.png';
  const isRemoteImg = /^https?:\/\//i.test(img) && !img.startsWith('data:');
  const safeImg = isRemoteImg ? img : 'https://og2vsalt-svg.github.io/rank/og.png';
  const c = color || '#0A84FF';
  const imgType = mime && String(mime).startsWith('image/') ? mime : 'image/png';
  const extra = [];
  extra.push('<meta name="og:image:width" content="1200" />');
  extra.push('<link rel="image_src" href="' + esc(safeImg) + '" />');
  extra.push('<meta name="msapplication-TileColor" content="' + esc(c) + '" />');
  extra.push('<meta name="theme-color" content="' + esc(c) + '" />');
  extra.push('<meta property="og:site_name" content="rankvault" />');
  extra.push('<meta name="twitter:card" content="summary_large_image" />');
  if (mime && String(mime).startsWith('video/') && isRemoteImg && image) {
    extra.push('<meta property="og:video" content="' + esc(image) + '" />');
    extra.push('<meta property="og:video:type" content="' + esc(mime) + '" />');
    extra.push('<meta property="og:type" content="video.other" />');
  }
  if (mime && String(mime).startsWith('audio/') && isRemoteImg && image) {
    extra.push('<meta property="og:audio" content="' + esc(image) + '" />');
    extra.push('<meta property="og:audio:type" content="' + esc(mime) + '" />');
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta name="theme-color" content="${esc(c)}" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${esc(c)}" />
<meta name="robots" content="noindex" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="rankvault" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(safeImg)}" />
<meta property="og:image:secure_url" content="${esc(safeImg)}" />
<meta property="og:image:type" content="${esc(imgType)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(title)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:locale" content="en_US" />
${extra.join('\n')}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(safeImg)}" />
<meta name="twitter:image:alt" content="${esc(title)}" />
<link rel="canonical" href="${esc(url)}" />
</head>
<body style="background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;padding:48px 24px">
<p style="opacity:.7;font-size:14px">rankvault</p>
<h1 style="font-size:28px;letter-spacing:-.03em">${esc(title)}</h1>
<p style="color:#a1a1aa;max-width:40rem">${esc(desc)}</p>
<p><a href="${esc(url)}" style="color:#0a84ff">open in rankvault</a></p>
<script>if(!/discord|bot|embed|preview/i.test(navigator.userAgent||'')) location.replace(${JSON.stringify(url)});</script>
</body>
</html>`;
}

async function loadShare(id) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,expires_at,is_public,author,download_count&limit=1`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
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
  drop: 'drop — rankvault',
  portage: 'portage — haul files',
  gazette: 'gazette — public drops',
  convoy: 'convoy — pack a drop',
  bazaar: 'bazaar — browse public files',
  atoll: 'atoll — embed card',
  tandem: 'tandem — pair two files',
  octave: 'octave — listen desk',
  filament: 'filament — text to file',
  horizon: 'horizon — link card',
  opal: 'opal — color pull',
  nest: 'nest — pack files',
  thorn: 'thorn — sticky pins',
  marrow: 'marrow — listen',
  studio: 'studio — rankvault',
  parcel: 'parcel — rankvault',
  signal: 'signal — rankvault',
  hush: 'hush — rankvault',
  manor: 'manor — public drops',
  share: 'share — rankvault',
  pebble: 'pebble — stills',
  lantern: 'lantern — cards',
  sluice: 'sluice — queue',
  reef: 'reef — link card',
  pollen: 'pollen — stills',
  ledge: 'ledge — scraps',
  isthmus: 'isthmus — pair two drops',
  saffron: 'saffron — warm cards',
  bramble: 'bramble — link thicket',
  grove: 'grove — share stands',
  vellum: 'vellum — text desk',
  copper: 'copper — file check',
  pavilion: 'pavilion — countdown card',
  sanctum: 'sanctum — private desk',
  trestle: 'trestle — compare two files',
  umber: 'umber — warm grade',
  basin: 'basin — word weather',
  chapel: 'chapel — quiet reader',
  observatory: 'observatory — vault glance',
  atrium: 'atrium — public foyer',
  halo: 'halo — circle crop',
  kite: 'kite — share timer',
  tide: 'tide — send one by one',
  willow: 'willow — strip photo tags',
  glacier: 'glacier — file fingerprint',
  lichen: 'lichen — preview card',
  gully: 'gully — split a file',
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
    res.status(200).send(pageHtml({ title, desc, image: undefined, url: dest, color: '#0A84FF' }));
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
  const title = live ? `${row.name}` : 'rankvault drop';
  const kind = (live && row.mime) ? String(row.mime).split(';')[0] : 'file';
  const desc = live
    ? `${kind} · ${prettySize(row.size)}${row.author ? ' · ' + row.author : ''}${row.download_count ? ' · ' + row.download_count + ' opens' : ''} · public drop on rankvault`
    : 'a quiet file drop. open to download.';
  const mime = String((live && row.mime) || '');
  const image = live && (mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')) && String(row.file_url || '').startsWith('http')
    ? row.file_url
    : undefined;

  if (!isBot(req.headers['user-agent']) && req.query.embed !== '1') {
    res.status(302).setHeader('Location', appUrl);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(pageHtml({ title, desc, image, url: appUrl, color: '#0A84FF', mime }));
}
