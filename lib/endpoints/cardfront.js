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
  keystone: 'a place pin with one local file. bytes land in storage and the keystones table. large drops are warned, never refused.',
  voussoir: 'the public arch of keystone pins. not a cabinet.',
  passbook: 'a receipt for a local file. bytes land in storage and the passbooks table. large drops are warned, never refused.',
  haversack: 'one local file hung with an errand. bytes land in the couriers table. large drops are warned, never refused.',
  pegboard: 'the public board of haversacks waiting to be collected. not a file cabinet.',
  stub: 'a counterfoil with an optional local file. bytes land in storage and the stubs table. large drops are warned, never refused.',
  counterfoil: 'the stub desk, under another name. paste /stub/id in discord for the card.',
  waybill: 'a delivery slip with optional local file and stamped stops. large drops are warned, never refused.',
  porter: 'the public index of waybills. not a cabinet.',
  listening: 'a listening take. the local file lands in storage and the share table. large drops are warned, never refused.',
  setlist: 'the public index of listening takes. not a cabinet.',
  wicket: 'a local file passed through the wicket. bytes land in storage, the row lives in wickets. large drops are warned, never refused.',
  letterpress: 'a set card, not a cabinet. /letterpress/id unfurls the title and the line.',
  knocker: 'a calling note and a local file left at the door. large drops are warned, never refused.',
  beading: 'a local file set into a named room panel. bytes land in storage and beading_panels. large drops are warned, never refused.',
  skirting: 'the public index of beading panels. not a cabinet.',
  weatherboard: 'a notice with no file. /weatherboard/id unfurls the line.',
  commonplace: 'a kept line, not a file. /commonplace/id unfurls the sentence.',
  vault: 'local-first files. public drops go to the share table. large files are warned, never refused.',
  loft: 'a room for one local file. bytes land in storage and the lofts table. large drops are warned, never refused.',
  eaves: 'the public index of loft rooms. not a cabinet.',
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
  if (page === 'keystone' && id) {
    const row = await sbGet('keystones?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.place || 'keystone') + ' — keystone';
      desc = (row.reading ? String(row.reading).slice(0, 140) + ' · ' : '') + (row.file_name || 'file') + (row.size ? ' · ' + prettySize(row.size) : '');
      color = '#5e5ce6';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    } else {
      title = 'keystone — rankvault';
      desc = BLURBS.keystone;
      color = '#5e5ce6';
    }
  } else if (page === 'keystone') {
    title = 'keystone — rankvault';
    desc = BLURBS.keystone;
    color = '#5e5ce6';
  } else if (page === 'voussoir') {
    title = 'voussoir — rankvault';
    desc = BLURBS.voussoir;
    color = '#5e5ce6';
  } else if (page === 'loft' && id) {
    const row = await sbGet('lofts?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.title || row.file_name || 'loft') + ' — loft';
      desc = (row.caption || row.file_name || 'a file hung in the loft') + (row.size ? ' · ' + prettySize(row.size) : '');
      if (row.file_url && /^image\//.test(row.mime || '')) image = row.file_url;
    }
  } else if (page === 'loft') {
    title = 'loft — rankvault';
    desc = BLURBS.loft;
  } else if (page === 'eaves') {
    title = 'eaves — rankvault';
    desc = BLURBS.eaves;
  } else if (page === 'haversack' && id) {
    const row = await sbGet('couriers?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.file_name || 'haversack') + ' — haversack';
      desc = (row.errand ? String(row.errand).slice(0, 140) + ' · ' : '') + (row.for_whom ? 'for ' + row.for_whom + ' · ' : '') + prettySize(row.size) + (row.picked_up ? ' · picked up' : ' · still out');
      color = '#ff9f0a';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    } else {
      title = 'haversack — rankvault';
      desc = BLURBS.haversack;
      color = '#ff9f0a';
    }
  } else if (page === 'haversack') {
    title = 'haversack — rankvault';
    desc = BLURBS.haversack;
    color = '#ff9f0a';
  } else if (page === 'pegboard') {
    title = 'pegboard — rankvault';
    desc = BLURBS.pegboard;
    color = '#ff9f0a';
  } else if (page === 'passbook' && id) {
    const row = await sbGet('passbooks?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.recipient ? 'for ' + row.recipient : row.file_name || 'passbook') + ' — passbook';
      desc = (row.receipt ? String(row.receipt).slice(0, 160) + ' · ' : '') + prettySize(row.size) + (row.author ? ' · ' + row.author : '');
      color = row.accent || '#64D2FF';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    } else {
      title = 'passbook — rankvault';
      desc = BLURBS.passbook;
      color = '#64D2FF';
    }
  } else if (page === 'passbook') {
    title = 'passbook — rankvault';
    desc = BLURBS.passbook;
    color = '#64D2FF';
  } else if ((page === 'stub' || page === 'counterfoil') && id) {
    const row = await sbGet('stubs?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.label || 'stub') + ' — stub';
      desc = (row.for_whom ? 'for ' + row.for_whom + ' · ' : '') + (row.note ? String(row.note).slice(0, 140) + ' · ' : '') + (row.handed_at ? 'handed over' : 'still on the counter') + (row.size ? ' · ' + prettySize(row.size) : '');
      color = row.accent || '#30D158';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (id && SHARE_PAGES.has(page)) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.meta && row.meta.cardTitle) || row.name || page; desc = row.caption || prettySize(row.size) + ' · public drop on rankvault'; if (/^image\//.test(row.mime || '')) image = row.file_url; color = (row.meta && (row.meta.color || row.meta.accent)) || color; }
  } else if (id) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) { title = (row.meta && row.meta.cardTitle) || row.name || page; desc = row.caption || prettySize(row.size) + ' · public drop on rankvault'; if (/^image\//.test(row.mime || '')) image = row.file_url; color = (row.meta && (row.meta.color || row.meta.accent)) || color; }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html({ title, desc, image, url: dest, color }));
}
