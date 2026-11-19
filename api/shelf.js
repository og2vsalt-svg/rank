function esc(s) {
  const amp = String.fromCharCode(38);
  return String(s || '')
    .split(amp).join(amp + 'amp;')
    .split('<').join(amp + 'lt;')
    .split('>').join(amp + 'gt;')
    .split('"').join(amp + 'quot;');
}

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const FALLBACK = 'https://og2vsalt-svg.github.io/rank/og.png';

const COPY = {
  quietdrift: ["Quiet Drift — rankvault", "Drop local files. They settle with staggered spring drift on frosted glass. Give each its own quiet caption, or share one. They publish independently to the database with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style springs."],
  quietlumenfold: ["Quiet Lumen Fold — rankvault", "Drop local files into layered soft light folds. Warm glow, spring motion on frosted glass. Individual or shared captions. They settle into the database with a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs."],
  quietsearch: ["Quiet Search — rankvault", "Discover recent public shares. Search by name or caption. Filter by type. Each opens with a polished Discord embed. Soft spring motion on frosted glass. Soft size warnings only. No hard limits."],
  quietstamp: ["Quiet Stamp — rankvault", "Drop local images. A quiet caption is stamped onto a polished polaroid-style version. The stamped image settles into the database with a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass."],
  quietpulse: ["Quiet Pulse — rankvault", "Drop a local file. It joins a living pulse of recent public shares with gentle heartbeat motion. Shared caption and accent. Publishes to the database. Every link carries a polished Discord embed. Soft size warnings only. No hard limits."],
  quiettide: ["Quiet Tide — rankvault", "Drop local files onto a soft tidal wave of frosted glass. Shared note and accent. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits."],
  quietkeepsake: ["Quiet Keepsake — rankvault", "Drop files that matter. Give each a short personal note. They settle into the database with polished Discord embeds. Soft size warnings only. No hard limits."],
  quietframe: ["Quiet Frame — rankvault", "Drop an image. It settles into a soft polaroid frame and publishes with a polished Discord embed. Soft size warnings only. No hard limits."],
  quietecho: ["Quiet Echo — rankvault", "Multi-file drop with soft expanding circular rings in your accent color. Shared note. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft warnings only."],
  quietechoes: ["Quiet Echoes — rankvault", "Drop local files and add a personal note to each. They publish independently to the database as sequential echoes with polished Discord embeds on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass."],
  quietcanvas: ["Quiet Canvas — rankvault", "Freehand sketch on frosted glass. Export and share with a polished Discord embed. Soft size warnings only. No hard limits."],
  quietnotes: ["Quiet Notes — rankvault", "Local collection of short notes. Publish the whole set as a shared text file with a polished Discord embed. Soft warnings only."],
  quietmosaic: ["Quiet Mosaic — rankvault", "Drop several images. They settle into a soft mosaic of frosted glass tiles. Publish the collection with a polished Discord embed. Soft size warnings only. No hard limits."],
  quietwhisper: ["Quiet Whisper — rankvault", "Write a short private note. Optionally lock it with a passphrase or set a soft expiry. Publishes with a polished Discord embed. Soft warnings only."],
  quietlantern: ["Quiet Lantern — rankvault", "Drop local files. They hang as soft glowing lanterns with gentle floating motion. Share to the database. Polished Discord embeds. Soft warnings only."],
  quietdrop: ["Quiet Drop — rankvault", "A clean central drop zone for local files. Live previews, shared caption, accent color, spring motion on frosted glass. Soft size warnings only. No hard limits."],
  quietatlas: ["Quiet Atlas — rankvault", "Living map of recent public shares. Search, preview, and open. Soft spring-entry frosted cards. Professional Discord embeds on every link. Drop new files into the atlas."],
  quietbeacon: ["Quiet Beacon — rankvault", "Still activity view of the latest public shares with open counts. Soft spring-entry frosted cards."],
  quietflow: ["Quiet Flow — rankvault", "Drop local files. They drift into place with staggered spring motion on frosted glass. Soft size warnings only."],
  quietgallery: ["Quiet Gallery — rankvault", "Visual public archive of recent shares. Spring-animated frosted glass cards."],
  quiethorizon: ["Quiet Horizon — rankvault", "Drop local files. They settle along a quiet glowing horizon of frosted glass."],
  quietpaste: ["Quiet Paste — rankvault", "A still surface for notes and snippets. Publish as a quiet text file."],
  quietqr: ["Quiet QR — rankvault", "Turn any URL or short text into a clean QR code and publish it."],
  quietconstellation: ["Quiet Constellation — rankvault", "Drop local files. They settle as stars in a quiet constellation of frosted glass with gentle connecting lines and spring motion. Shared caption and accent. Batch-publish to the database. Every link carries a polished Discord embed. Soft size warnings only. No hard limits."],
  canvasforge: ["Canvas Forge — rankvault", "Freehand sketch on a quiet dark canvas. Export as PNG and publish to the database. Every share link carries a professional Discord embed. Soft size warnings only. No hard limits. Apple spring motion on frosted glass."],
  weave: ["Weave — rankvault", "Drop several local files. Give each its own caption and accent color. They publish independently with polished Discord embeds on every link. Soft warnings only. No hard limits."],
  quietsolstice: ["Quiet Solstice — rankvault", "Drop local files under a turning sun. Soft radial motion, shared caption, chosen warmth. Discord cards on every link. Size notes only. No hard limits."],
  quietmeridian: ["Quiet Meridian — rankvault", "A still center for precise local file drops. Live time, soft warnings only. Every share link carries a polished Discord embed."],
  quietequinox: ["Quiet Equinox — rankvault", "Where files find balance. Dual columns of frosted glass. Batch-publish with polished Discord embeds. Soft size warnings only."],
  quietpin: ["Quiet Pin — rankvault", "Pin a local file to a place name or coordinates. It settles into the database with a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass."],
  quietstack: ["Quiet Stack — rankvault", "Stack local files with individual captions. Layered frosted previews, spring motion. Each publishes independently to the database with a polished Discord embed. Soft size warnings only. No hard limits."],
  quietbinder: ["Quiet Binder — rankvault", "Drop several local files into one quiet binder. Each settles independently into the database. A single binder note lists them all with a polished Discord embed. Soft size warnings only. No hard limits. Apple-style springs on frosted glass."],
  quietlens: ["Quiet Lens — rankvault", "Drop local images. A soft focus lens settles over them with spring motion on frosted glass. Shared caption, accent color. They publish to the database with a polished Discord embed on every link. Soft size warnings only. No hard limits."],
  quietdiary: ["Quiet Diary — rankvault", "Drop local files into a dated diary. Each entry carries the day and a shared note. They settle into the database with a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass."],
  quietsketch: ["Quiet Sketch — rankvault", "Freehand sketch on a quiet dark canvas. Export as PNG and publish to the database with a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass."],
  quietquote: ["Quiet Quote — rankvault", "Write a short quote or note with optional attribution. It settles into the database as a text file with a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass."],
  home: ['rankvault', 'Private file hosting and sharing. Upload local files, share with professional Discord embeds. Soft size warnings only. Sleek Apple-style interface with many specialized desks.'],
};

async function getShare(id) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=name,mime,size,caption,file_url,meta&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

function prettySize(n) {
  if (!n) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace(/^\//, '').split('/')[0] || 'home';
  const shareMatch = url.pathname.match(/\/s\/([a-z0-9]+)/i);

  let title = 'rankvault';
  let description = COPY.home[1];
  let image = FALLBACK;

  if (shareMatch) {
    const row = await getShare(shareMatch[1]);
    if (row) {
      title = row.meta?.cardTitle || row.name || 'Shared file';
      description = row.caption || `${row.mime || 'file'} · ${prettySize(row.size)}`;
      if (row.mime && row.mime.startsWith('image/') && row.file_url) {
        image = row.file_url;
      }
    } else {
      title = 'Shared file — rankvault';
      description = 'A private share from rankvault.';
    }
  } else {
    const key = path.toLowerCase();
    const entry = COPY[key] || COPY.home;
    title = entry[0];
    description = entry[1];
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="rankvault" />
  <meta property="og:url" content="${esc(url.href)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
</head>
<body>
  <p>${esc(title)}</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).send(html);
}
