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
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider|redditbot|applebot|discordbot|iframely|unfurl|valve|steam|pinterest|notion|teams|slack-imgproxy/.test(u);
}

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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
  extra.push('<meta name="application-name" content="rankvault" />');
  extra.push('<meta name="apple-mobile-web-app-title" content="rankvault" />');
  extra.push('<meta name="og:rich_attachment" content="true" />');
  if (mime && String(mime).startsWith('video/') && isRemoteImg && image) {
    extra.push('<meta property="og:video" content="' + esc(image) + '" />');
    extra.push('<meta property="og:video:secure_url" content="' + esc(image) + '" />');
    extra.push('<meta property="og:video:type" content="' + esc(mime) + '" />');
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
<meta property="og:url" content="${esc(url)}" />
${extra.join('\n')}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(safeImg)}" />
<link rel="canonical" href="${esc(url)}" />
</head>
<body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px;min-height:100vh">
<div style="max-width:36rem">
<p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p>
<h1 style="font-size:32px;letter-spacing:-.04em;font-weight:600;margin:12px 0 16px">${esc(title)}</h1>
<p style="color:#a1a1aa;max-width:40rem;line-height:1.55">${esc(desc)}</p>
<p style="margin-top:28px"><a href="${esc(url)}" style="color:#0a84ff;text-decoration:none">open in rankvault →</a></p>
</div>
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
  share: 'share — rankvault',
  quoin: 'quoin — a corner card',
  soffit: 'soffit — write on the underside',
  taffrail: 'taffrail — lean on the public rail',
  rondel: 'rondel — three lines that return',
  scuttle: 'scuttle — a hatch for one local',
  mere: 'mere — a still pool of words',
  glean: 'glean — walk the field of public drops',
  dewpond: 'dewpond — a drop that evaporates',
  saggar: 'saggar — several pieces, one firing',
  emboss: 'emboss — raise a title on a note',
  sluice: 'sluice — pour a local into the share db',
  kettle: 'kettle — steep a local, then pour it',
  millrace: 'millrace — send a local file down the channel',
  lychgate: 'lychgate — a note that walks out as a public drop',
  gantry: 'gantry — hoist a still, then publish the original',
  clew: 'clew — wind a thread of notes into one share',
  porch: 'porch — preview the discord card for a drop',
  deadeye: 'deadeye — name a drop, then let it fly',
  scupper: 'scupper — drain a folder into a readable list',
  gunwale: 'gunwale — fingerprint locals without sending them',
  companionway: 'companionway — write downstairs, share upstairs',
  skerry: 'skerry — an island drop that fades on its own',
  eyot: 'eyot — a sandbar of words',
  glade: 'glade — light from a still, kept in the tab',
  bothy: 'bothy — a hut for scraps',
  wherry: 'wherry — ferry several locals across',
  windlass: 'windlass — hoist a local onto the public capstan',
  catenary: 'catenary — hang file weight on a quiet curve',
  spar: 'spar — one short public line',
  mullion: 'mullion — split a draft into panes',
  hawse: 'hawse — thread a note through a spoken phrase',
  fluke: 'fluke — hook a local file and let it drift',
  thwart: 'thwart — sit across the public bench and look',
  coaming: 'coaming — raise a lip around a note',
  copse: 'copse — a grove of colour from a still',
  riprap: 'riprap — stack a bank of sentences',
  wicket: 'wicket — a small gate for a note',
  leat: 'leat — let a channel of words run',
};

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();

  if (page && !id) {
    const dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    const title = PAGE_TITLES[page] || `${page} — rankvault`;
    const desc = 'quiet file hosting. drop a file, share only if you want. discord cards on every /s link.';
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
