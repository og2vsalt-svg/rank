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
  extra.push('<meta name="twitter:site" content="@rankvault" />');
  if (mime && String(mime).startsWith('video/') && isRemoteImg && image) {
    extra.push('<meta property="og:video" content="' + esc(image) + '" />');
    extra.push('<meta property="og:video:secure_url" content="' + esc(image) + '" />');
    extra.push('<meta property="og:video:type" content="' + esc(mime) + '" />');
  }
  if (mime && String(mime).startsWith('audio/') && isRemoteImg && image) {
    extra.push('<meta property="og:audio" content="' + esc(image) + '" />');
    extra.push('<meta property="og:audio:type" content="' + esc(mime) + '" />');
  }
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}" />\n<meta name="theme-color" content="${esc(c)}" />\n<meta name="robots" content="noindex" />\n<meta property="og:type" content="website" />\n<meta property="og:site_name" content="rankvault" />\n<meta property="og:title" content="${esc(title)}" />\n<meta property="og:description" content="${esc(desc)}" />\n<meta property="og:image" content="${esc(safeImg)}" />\n<meta property="og:image:secure_url" content="${esc(safeImg)}" />\n<meta property="og:image:type" content="${esc(imgType)}" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta property="og:url" content="${esc(url)}" />\n${extra.join('\\n')}\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${esc(title)}" />\n<meta name="twitter:description" content="${esc(desc)}" />\n<meta name="twitter:image" content="${esc(safeImg)}" />\n<link rel="canonical" href="${esc(url)}" />\n</head>\n<body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px;min-height:100vh">\n<div style="max-width:36rem">\n<p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p>\n<h1 style="font-size:32px;letter-spacing:-.04em;font-weight:600;margin:12px 0 16px">${esc(title)}</h1>\n<p style="color:#a1a1aa;max-width:40rem;line-height:1.55">${esc(desc)}</p>\n<p style="margin-top:28px"><a href="${esc(url)}" style="color:#0a84ff;text-decoration:none">open in rankvault \u2192</a></p>\n</div>\n<script>if(!/discord|bot|embed|preview/i.test(navigator.userAgent||'')) location.replace(${JSON.stringify(url)});</script>\n</body>\n</html>`;
}

async function loadShare(id) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,expires_at,is_public,author,download_count,meta&limit=1`;
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
  quoin: 'quoin \u2014 a corner card',
  soffit: 'soffit \u2014 write on the underside',
  taffrail: 'taffrail \u2014 lean on the public rail',
  rondel: 'rondel \u2014 three lines that return',
  scuttle: 'scuttle \u2014 a hatch for one local',
  mere: 'mere \u2014 a still pool of words',
  glean: 'glean \u2014 walk the field of public drops',
  dewpond: 'dewpond \u2014 a drop that evaporates',
  saggar: 'saggar \u2014 several pieces, one firing',
  emboss: 'emboss \u2014 raise a title on a note',
  sluice: 'sluice \u2014 pour a local into the share db',
  kettle: 'kettle \u2014 steep a local, then pour it',
  millrace: 'millrace \u2014 send a local file down the channel',
  lychgate: 'lychgate \u2014 a note that walks out as a public drop',
  gantry: 'gantry \u2014 hoist a still, then publish the original',
  clew: 'clew \u2014 wind a thread of notes into one share',
  porch: 'porch \u2014 preview the discord card for a drop',
  deadeye: 'deadeye \u2014 name a drop, then let it fly',
  scupper: 'scupper \u2014 drain a folder into a readable list',
  gunwale: 'gunwale \u2014 fingerprint locals without sending them',
  companionway: 'companionway \u2014 write downstairs, share upstairs',
  skerry: 'skerry \u2014 an island drop that fades on its own',
  eyot: 'eyot \u2014 a sandbar of words',
  glade: 'glade \u2014 light from a still, kept in the tab',
  bothy: 'bothy \u2014 a hut for scraps',
  wherry: 'wherry \u2014 ferry several locals across',
  windlass: 'windlass \u2014 hoist a local onto the public capstan',
  catenary: 'catenary \u2014 hang file weight on a quiet curve',
  spar: 'spar \u2014 one short public line',
  mullion: 'mullion \u2014 split a draft into panes',
  hawse: 'hawse \u2014 thread a note through a spoken phrase',
  fluke: 'fluke \u2014 hook a local file and let it drift',
  thwart: 'thwart \u2014 sit across the public bench and look',
  coaming: 'coaming \u2014 raise a lip around a note',
  copse: 'copse \u2014 a grove of colour from a still',
  riprap: 'riprap \u2014 stack a bank of sentences',
  wicket: 'wicket \u2014 a small gate for a note',
  leat: 'leat \u2014 let a channel of words run',
  jamb: 'jamb \u2014 a doorframe for a note',
  lintol: 'lintol \u2014 weigh a draft in the tab',
  impost: 'impost \u2014 seat one file on the springing',
  fillet: 'fillet \u2014 a thin band of colour',
  ogee: 'ogee \u2014 a double curve of notes',
  voussoir: 'voussoir \u2014 set one local in the arch',
  scotia: 'scotia \u2014 a stair of small jobs',
  necking: 'necking \u2014 a window for wording',
  abacus: 'abacus \u2014 a stand for one passage',
  volute: 'volute \u2014 a shelf for addresses',
  astragal: 'astragal \u2014 a file with a note attached',
  modillion: 'modillion \u2014 a bracket for names',
};

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();

  if (page && !id) {
    const dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    const title = PAGE_TITLES[page] || `${page} \u2014 rankvault`;
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
  const caption = live && row.meta && row.meta.caption ? String(row.meta.caption) : '';
  const desc = live
    ? `${caption ? caption + ' \u00b7 ' : ''}${kind} \u00b7 ${prettySize(row.size)}${row.author ? ' \u00b7 ' + row.author : ''}${row.download_count ? ' \u00b7 ' + row.download_count + ' opens' : ''} \u00b7 public drop on rankvault`
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
