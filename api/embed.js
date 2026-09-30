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
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
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
  extra.push('<link rel="image_src" href="' + esc(safeImg) + '" />');
  extra.push('<meta name="theme-color" content="' + esc(c) + '" />');
  extra.push('<meta name="msapplication-TileColor" content="' + esc(c) + '" />');
  extra.push('<meta property="og:locale" content="en_US" />');
  extra.push('<meta property="og:site_name" content="rankvault" />');
  extra.push('<meta name="twitter:card" content="summary_large_image" />');
  extra.push('<meta name="twitter:image" content="' + esc(safeImg) + '" />');
  extra.push('<meta name="twitter:image:src" content="' + esc(safeImg) + '" />');
  extra.push('<meta name="twitter:title" content="' + esc(title) + '" />');
  extra.push('<meta name="twitter:description" content="' + esc(desc) + '" />');
  extra.push('<meta property="og:image:width" content="1200" />');
  extra.push('<meta property="og:image:height" content="630" />');
  extra.push('<meta property="og:image:alt" content="' + esc(title) + '" />');
  extra.push('<meta name="twitter:image:alt" content="' + esc(title) + '" />');
  extra.push('<meta name="color-scheme" content="dark" />');
  extra.push('<meta property="og:determiner" content="a" />');
  extra.push('<meta name="application-name" content="rankvault" />');
  if (mime && String(mime).startsWith('video/') && isRemoteImg && image) {
    extra.push('<meta property="og:video" content="' + esc(image) + '" />');
    extra.push('<meta property="og:video:type" content="' + esc(mime) + '" />');
  }
  if (mime && String(mime).startsWith('audio/') && isRemoteImg && image) {
    extra.push('<meta property="og:audio" content="' + esc(image) + '" />');
    extra.push('<meta property="og:audio:type" content="' + esc(mime) + '" />');
  }
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}" />\n<meta name="theme-color" content="${esc(c)}" />\n<meta name="robots" content="noindex" />\n<meta property="og:type" content="website" />\n<meta property="og:site_name" content="rankvault" />\n<meta property="og:title" content="${esc(title)}" />\n<meta property="og:description" content="${esc(desc)}" />\n<meta property="og:image" content="${esc(safeImg)}" />\n<meta property="og:image:secure_url" content="${esc(safeImg)}" />\n<meta property="og:image:type" content="${esc(imgType)}" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta property="og:url" content="${esc(url)}" />\n${extra.join('\n')}\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${esc(title)}" />\n<meta name="twitter:description" content="${esc(desc)}" />\n<meta name="twitter:image" content="${esc(safeImg)}" />\n<link rel="canonical" href="${esc(url)}" />\n</head>\n<body style="background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;padding:48px 24px">\n<p style="opacity:.7;font-size:14px">rankvault</p>\n<h1 style="font-size:28px;letter-spacing:-.03em">${esc(title)}</h1>\n<p style="color:#a1a1aa;max-width:40rem">${esc(desc)}</p>\n<p><a href="${esc(url)}" style="color:#0a84ff">open in rankvault</a></p>\n<script>if(!/discord|bot|embed|preview/i.test(navigator.userAgent||'')) location.replace(${JSON.stringify(url)});</script>\n</body>\n</html>`;
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
  vault: 'vault \u2014 rankvault',
  drop: 'drop \u2014 rankvault',
  share: 'share \u2014 rankvault',
  haven: 'haven \u2014 paste a note into the share db',
  skein: 'skein \u2014 wind lines into one drop',
  belfry: 'belfry \u2014 a quiet local chime',
  quay: 'quay \u2014 dock a file into the share db',
  mooring: 'mooring \u2014 tie several locals to one index card',
  towpath: 'towpath \u2014 walk a local file into the share db',
  buoy: 'buoy \u2014 preview a discord card',
  hawser: 'hawser \u2014 braid drop ids into one line',
  garret: 'garret \u2014 a local attic of drop ids',
  lockgate: 'lockgate \u2014 publish with a pass and tide',
  fid: 'fid \u2014 peek at the first bytes, then ship',
  spinnaker: 'spinnaker \u2014 pack a drop into a share sheet',
  taffrail: 'taffrail \u2014 inspect a discord card',
  yardarm: 'yardarm \u2014 hash a local file then publish',
  porchlight: 'porchlight \u2014 drop a file and preview the discord card',
  stillwater: 'stillwater \u2014 park files in the share db',
  fathom: 'fathom \u2014 hash a local file then publish',
  windrow: 'windrow \u2014 rake several locals into the share db',
  splice: 'splice \u2014 braid a note with a file',
  meander: 'meander \u2014 preview a still then publish',
  ford: 'ford \u2014 ship the heavier of two locals',
  kilter: 'kilter \u2014 a note plus a file ticket',
  reliquary: 'reliquary \u2014 caption a file for the share db',
  solstice: 'solstice \u2014 hash two locals, ship one',
  palimpsest: 'palimpsest \u2014 write a note into the share db',
  keyring: 'keyring \u2014 every embed alias for one drop',
};

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();

  if (page && !id) {
    const dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    const title = PAGE_TITLES[page] || `${page} \u2014 rankvault`;
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
    ? `${kind} \u00b7 ${prettySize(row.size)}${row.author ? ' \u00b7 ' + row.author : ''}${row.download_count ? ' \u00b7 ' + row.download_count + ' opens' : ''} \u00b7 public drop on rankvault`
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
