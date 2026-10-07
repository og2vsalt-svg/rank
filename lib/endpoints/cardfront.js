const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  const amp = '&' + 'amp;';
  const lt = '&' + 'lt;';
  const gt = '&' + 'gt;';
  const quot = '&' + 'quot;';
  return String(s || '').split('&').join(amp).split('<').join(lt).split('>').join(gt).split('"').join(quot);
}
function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
async function sbGet(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch { return null; }
}
function html({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '" /><meta name="theme-color" content="' + esc(c) + '" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="' + esc(title) + '" /><meta property="og:description" content="' + esc(desc) + '" /><meta property="og:image" content="' + esc(safeImg) + '" /><meta property="og:image:secure_url" content="' + esc(safeImg) + '" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:type" content="image/png" /><meta property="og:image:alt" content="rankvault" /><meta property="og:url" content="' + esc(url) + '" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="' + esc(title) + '" /><meta name="twitter:description" content="' + esc(desc) + '" /><meta name="twitter:image" content="' + esc(safeImg) + '" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;letter-spacing:.12em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em;font-size:34px">' + esc(title) + '</h1><p style="color:#a1a1aa;max-width:42rem">' + esc(desc) + '</p></body></html>';
}
const BLURBS = {
  home: 'private file hosting. discord cards on every link, including this one.',
  wicket: 'a local file passed through the wicket. bytes land in storage, the row lives in wickets. large drops are warned, never refused.',
  letterpress: 'a set card, not a cabinet. /letterpress/id unfurls the title and the line.',
  knocker: 'a calling note and a local file left at the door. large drops are warned, never refused.',
  wainscot: 'a local file set into a named room panel. bytes land in storage and wainscot_panels. large drops are warned, never refused.',
  skirting: 'the public index of wainscot panels. not a cabinet.',
  weatherboard: 'a notice with no file. /weatherboard/id unfurls the line.',
  commonplace: 'a kept line, not a file. /commonplace/id unfurls the sentence.',
  vault: 'local-first files. public drops go to the share table. large files are warned, never refused.',
  linen: 'a local file folded for someone. the label lives in linen_press.',
  stillroom: 'a short note, not a file. the row lives in stillroom_notes.',
  keepsake: 'a local file filed to storage and the keepsakes table.',
  dado: 'a local file pinned to a named room. no size cap.',
  pallet: 'several local files, one slip. large drops are warned, never refused.',
  dossier: 'a local file filed to the dossier desk.',
  satchel: 'a named bag of local files.',
  copydesk: 'a typed slip, not a cabinet.',
  fieldbook: 'a page of notes. no file, no cabinet.',
  seal: 'a local file plus its sha-256. large drops are warned, never refused.',
  handover: 'a local file passed along a chain.',
  parcel: 'a local file addressed to someone.',
  unfurl: 'preview the discord card for any rankvault link before you paste it.'
};
const SHARE_PAGES = new Set(['s', 'share', 'f', 'open', 'go', 'link', 'card']);
export default async function handler(req, res) {
  const page = (req.query.page || 'home').toString().toLowerCase();
  const id = (req.query.id || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app').toString();
  const dest = proto + '://' + host + (page === 'home' ? '/' : '/' + page + (id ? '/' + encodeURIComponent(id) : ''));
  let title = page === 'home' ? 'rankvault — private file hosting' : page + ' — rankvault';
  let desc = BLURBS[page] || 'a desk on rankvault. large files are warned, never refused. discord cards on every link.';
  let image;
  let color = '#0A84FF';
  if (page === 'letterpress' && id) {
    const row = await sbGet('letterpress?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.title || 'letterpress') + ' — letterpress'; desc = String(row.body || '').slice(0, 180) + (row.author ? ' · ' + row.author : ''); color = row.accent || color; }
  } else if (page === 'wicket' && id) {
    const row = await sbGet('wickets?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.file_name || 'file') + ' — wicket'; desc = (row.caller ? row.caller + ' passed a file' : 'a file through the wicket') + (row.note ? ' · ' + String(row.note).slice(0, 160) : '') + ' · ' + prettySize(row.size); color = row.accent || color; if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url; }
  } else if (page === 'knocker' && id) {
    const row = await sbGet('knockers?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.file_name || 'knock') + ' — knocker'; desc = (row.caller ? row.caller + ' left a file' : 'a file at the door') + (row.note ? ' · ' + String(row.note).slice(0, 160) : '') + ' · ' + prettySize(row.size); color = row.accent || color; if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url; }
  } else if (page === 'wainscot' && id) {
    const row = await sbGet('wainscot_panels?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.file_name || 'panel') + ' — wainscot'; desc = (row.room ? row.room + ' · ' : '') + (row.caption ? String(row.caption).slice(0, 160) + ' · ' : '') + prettySize(row.size); color = row.accent || color; if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url; }
  } else if (page === 'weatherboard' && id) {
    const row = await sbGet('weatherboard_notes?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.title || 'notice') + ' — weatherboard'; desc = (row.author ? row.author + ' · ' : '') + String(row.body || '').slice(0, 180); color = row.accent || '#FFD60A'; }
  } else if (page === 'commonplace' && id) {
    const row = await sbGet('commonplace?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = 'commonplace — rankvault'; desc = String(row.line || '').slice(0, 180) + (row.author ? ' · ' + row.author : ''); color = '#FFD60A'; }
  } else if (page === 'linen' && id) {
    const row = await sbGet('linen_press?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.name || 'linen fold'; desc = (row.receiver ? 'for ' + row.receiver + ' · ' : '') + (row.note || prettySize(row.size)); color = '#64D2FF'; if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url; }
  } else if (page === 'stillroom' && id) {
    const row = await sbGet('stillroom_notes?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.title || 'stillroom note'; desc = (row.author ? row.author + ': ' : '') + String(row.body || '').slice(0, 180); color = '#FFD60A'; }
  } else if (page === 'courier' && id) {
    const row = await sbGet('hosted_files?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.name || 'courier file'; desc = row.note || prettySize(row.size) + ' filed on rankvault'; if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url; }
  } else if (page === 'folio' && id) {
    const row = await sbGet('folios?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.title + ' — folio'; desc = (row.author ? row.author + ' · ' : '') + prettySize(row.size); if (/^image\//.test(row.mime || '')) image = row.file_url; }
  } else if (page === 'dado' && id) {
    const row = await sbGet('dado_pins?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.title || row.file_name || 'dado') + ' — dado'; desc = (row.room ? row.room + ' · ' : '') + prettySize(row.size) + (row.note ? ' · ' + String(row.note).slice(0, 140) : ''); color = row.accent || color; if (/^image\//.test(row.mime || '')) image = row.file_url; }
  } else if (page === 'keepsake' && id) {
    const row = await sbGet('keepsakes?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.title || row.file_name || 'keepsake'; desc = (row.author ? row.author + ' · ' : '') + prettySize(row.size) + (row.note ? ' · ' + String(row.note).slice(0, 140) : ''); color = row.accent || color; if (/^image\//.test(row.mime || '')) image = row.file_url; }
  } else if (page === 'pallet' && id) {
    const row = await sbGet('pallets?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { const pieces = Array.isArray(row.pieces) ? row.pieces : []; title = row.receiver ? 'pallet for ' + row.receiver : 'pallet'; desc = row.note || (pieces.length + ' files on one slip'); const imagePiece = pieces.find((p) => p && String(p.mime || '').indexOf('image/') === 0 && p.url); if (imagePiece) image = imagePiece.url; }
  } else if (page === 'dossier' && id) {
    const row = await sbGet('dossiers?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.title + ' — dossier'; desc = (row.caption || row.name || 'a filed document') + (row.author ? ' · ' + row.author : ''); if (row.mime && String(row.mime).indexOf('image/') === 0 && row.file_url) image = row.file_url; }
  } else if (page === 'satchel' && id) {
    const row = await sbGet('satchels?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { const pieces = Array.isArray(row.pieces) ? row.pieces : []; title = row.title + ' — satchel'; desc = row.cover || (pieces.length + ' files in one bag'); color = row.accent || color; }
  } else if (page === 'copydesk' && id) {
    const row = await sbGet('copy_slips?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.title + ' — copy desk'; desc = String(row.body || '').slice(0, 180) + (row.author ? ' · ' + row.author : ''); color = row.accent || color; }
  } else if (page === 'fieldbook' && id) {
    const row = await sbGet('fieldbook_notes?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.title || 'fieldbook'; desc = (row.body || '').slice(0, 180) || 'a page on rankvault'; }
  } else if (page === 'stile' && id) {
    const row = await sbGet('relays?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = row.label || 'stile'; desc = row.note || row.target || 'a short link on rankvault'; }
  } else if (id) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.meta && row.meta.cardTitle) || row.name || page; desc = row.caption || prettySize(row.size) + ' · public drop on rankvault'; if (/^image\//.test(row.mime || '')) image = row.file_url; color = (row.meta && (row.meta.color || row.meta.accent)) || color; }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html({ title, desc, image, url: dest, color }));
}
