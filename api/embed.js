import { EXTRA_TITLES, EXTRA_DESC } from './deskCards.js';

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
    .replace(/\"/g, '"')
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

async function loadShare(id) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,expires_at,is_public,author,download_count,meta,caption&limit=1`;
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
  ...EXTRA_TITLES,
  outhaul: 'outhaul \u2014 a handoff, not a cabinet',
  jackstay: 'jackstay \u2014 a list you can hand over',
  parrel: 'parrel \u2014 a mark, then a card',
  luff: 'luff \u2014 keep one, file that one',
  berth: 'berth \u2014 name the slip, then hand the file',
  sounding: 'sounding \u2014 what is already on the water',
  fender: 'fender \u2014 a note that leaves as a file',
  bulkhead: 'bulkhead \u2014 a compartment of files',
  crosstree: 'crosstree \u2014 a still with a colour on the card',
  hold: 'hold \u2014 what is already on the deck',
  lazaret: 'lazaret \u2014 hand a local file across',
  loam: 'loam \u2014 a line you can hand someone',
  carrel: 'carrel \u2014 a shared watch list',
  orlop: 'orlop \u2014 notes under the waterline',
  vault: 'vault \u2014 rankvault',
  drop: 'drop \u2014 rankvault',
  mooring: 'mooring \u2014 tie a local file to the quay',
  bellows: 'bellows \u2014 a breath you can time',
  inkwell: 'inkwell \u2014 a mark, not a cabinet',
  hawser: 'hawser \u2014 both ends of the line',
  bitts: 'bitts \u2014 a receipt, not a cabinet',
  leadline: 'leadline \u2014 sound it, then send it',
  sheave: 'sheave \u2014 several files, one card',
  dolphin: 'dolphin \u2014 a voice on the pile',
  gudgeon: 'gudgeon \u2014 the hinge between two drafts',
  thrum: 'thrum \u2014 a loose end, filed',
  limber: 'limber \u2014 water finding its way',
  garnet: 'garnet \u2014 a deep red card',
  clew: 'clew \u2014 a letter that leaves as a file',
  sprit: 'sprit \u2014 a swatch board, not a cabinet',
  fid: 'fid \u2014 two drafts spliced into one drop',
  wharf: 'wharf \u2014 a link tied to the quay',
  topmark: 'topmark \u2014 one mark, several files',
  billet: 'billet \u2014 a slip for an address',
  gunnel: 'gunnel \u2014 what stays, what leaves',
  painter: 'painter \u2014 a colour on the discord card',
  oakum: 'oakum \u2014 a pack, filed one by one',
  scull: 'scull \u2014 a note rowed across',
};

const PAGE_DESC = {
  ...EXTRA_DESC,
  outhaul: 'Pick a local file, write who it is for, and file it. Discord unfurls the card. Large drops are warned, never refused.',
  jackstay: 'A checklist that files as text. Not the vault. The /s link is the Discord card.',
  parrel: 'Draw a mark in the tab and file it as a PNG. Image drops unfurl with the picture.',
  luff: 'Keep one local file and file only that one. The others stay on the machine.',
  hawser: 'Pass a local file with a handoff note. Discord unfurls the card. Expiry is optional.',
  bitts: 'Fingerprint a file in the tab, then publish it with the digest on the card.',
  leadline: 'Measure a local file, then write it to the share table. Large drops are warned, never refused.',
  sheave: 'Each local file lands in the share table. The index card is what Discord unfurls.',
  dolphin: 'Record a take in the tab and file it. No size ceiling, only a slowness note.',
  gudgeon: 'Compare two drafts locally, then file the hinge as a public text drop.',
  thrum: 'A short desk on rankvault. Discord unfurls this card. Files still land in the share table.',
  limber: 'A quiet desk on rankvault. Open the link for the room. Share cards stay on /s.',
  garnet: 'A colour desk on rankvault. The card is what Discord shows.',
  clew: 'Write a letter in the tab. Sending files it as text and gives you a Discord card. No size cutoff.',
  sprit: 'Build a swatch in the tab, then file the board as JSON. Large boards are warned, never refused.',
  fid: 'Splice two local drafts into one text drop. The card names both ends.',
  wharf: 'Save a link to the quay table and file a small card so Discord unfurls it.',
  topmark: 'Several local files land in the share table. Discord unfurls the pack note. Large packs are warned, never refused.',
  billet: 'An address on the links shelf, plus a one-line card Discord can unfurl. Not a file cabinet.',
  gunnel: 'Two columns, kept and sent, filed as one text drop. The /s link is the Discord card.',
  painter: 'Pick a local file, write the card line, stamp a colour. Bytes land in the share table. Large drops are warned, never refused.',
  oakum: 'Each local file is written to the share database. The shelf keeps the list. Discord unfurls the first card.',
  scull: 'Open a local text file or type a note. Filing writes a real file into the share table and hands Discord a card.',
};

function pageHtml({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\" /><title>${esc(title)}</title><meta name=\"description\" content=\"${esc(desc)}\" /><meta name=\"theme-color\" content=\"${esc(c)}\" /><meta property=\"og:type\" content=\"website\" /><meta property=\"og:site_name\" content=\"rankvault\" /><meta property=\"og:title\" content=\"${esc(title)}\" /><meta property=\"og:description\" content=\"${esc(desc)}\" /><meta property=\"og:image\" content=\"${esc(safeImg)}\" /><meta property=\"og:image:secure_url\" content=\"${esc(safeImg)}\" /><meta property=\"og:image:alt\" content=\"${esc(title)}\" /><meta property=\"og:image:width\" content=\"1200\" /><meta property=\"og:image:height\" content=\"630\" /><meta property=\"og:url\" content=\"${esc(url)}\" /><meta name=\"twitter:card\" content=\"summary_large_image\" /><meta name=\"twitter:title\" content=\"${esc(title)}\" /><meta name=\"twitter:description\" content=\"${esc(desc)}\" /><meta name=\"twitter:image\" content=\"${esc(safeImg)}\" /></head><body style=\"margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px\"><p style=\"opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase\">rankvault</p><h1 style=\"font-size:32px;letter-spacing:-.04em\">${esc(title)}</h1><p style=\"color:#a1a1aa\">${esc(desc)}</p><script>if(!/discord|bot|embed|preview/i.test(navigator.userAgent||'')) location.replace(${JSON.stringify(url)});</script></body></html>`;
}

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || '').toString().trim().toLowerCase();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();

  if (page && !id) {
    const dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    const title = PAGE_TITLES[page] || `${page} \u2014 rankvault`;
    const desc = PAGE_DESC[page] || 'quiet file hosting. drop a file, share only if you want. discord cards on every link.';
    if (!isBot(req.headers['user-agent']) && req.query.embed !== '1') {
      res.status(302).setHeader('Location', dest);
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(pageHtml({ title, desc, url: dest, color: '#0A84FF' }));
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
  const title = live ? ((row.meta && row.meta.cardTitle) || row.name) : 'rankvault drop';
  const kind = live && row.mime ? String(row.mime).split(';')[0] : 'file';
  const caption = live ? String((row.meta && row.meta.caption) || row.caption || '') : '';
  const desc = live
    ? `${caption ? caption + ' \u00b7 ' : ''}${kind} \u00b7 ${prettySize(row.size)}${row.author ? ' \u00b7 ' + row.author : ''} \u00b7 public drop on rankvault`
    : 'a quiet file drop. open to download.';
  const mime = String((live && row.mime) || '');
  const fileUrl = String((live && row.file_url) || '');
  const image = live && mime.startsWith('image/') && /^https?:\/\//i.test(fileUrl) ? fileUrl : undefined;

  if (!isBot(req.headers['user-agent']) && req.query.embed !== '1') {
    res.status(302).setHeader('Location', appUrl);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  const accent = live && row.meta && row.meta.color ? String(row.meta.color) : '#0A84FF';
  res.status(200).send(pageHtml({ title, desc, image, url: appUrl, color: accent }));
}
