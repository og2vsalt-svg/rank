import { EXTRA_TITLES, EXTRA_DESC } from '../lib/deskCards.js';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  const amp = String.fromCharCode(38);
  return String(s || '')
    .replace(/&/g, amp + 'amp;')
    .replace(/</g, amp + 'lt;')
    .replace(/>/g, amp + 'gt;')
    .replace(/"/g, amp + 'quot;')
    .replace(/'/g, amp + '#39;');
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

async function sbGet(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

async function loadShare(id) {
  return sbGet(`public_shares?id=eq.${encodeURIComponent(id)}&select=id,name,mime,size,file_url,expires_at,is_public,author,download_count,meta,caption&limit=1`);
}

async function loadParcel(id) {
  return sbGet(`parcels?id=eq.${encodeURIComponent(id)}&select=id,title,note,author,accent,items&limit=1`);
}

async function loadAsk(id) {
  return sbGet(`file_requests?id=eq.${encodeURIComponent(id)}&select=id,title,note,author,fulfilled_share_id&limit=1`);
}

async function loadReceipt(id) {
  return sbGet(`keelson_receipts?id=eq.${encodeURIComponent(id)}&select=id,share_id,from_name,to_name,note,file_name,size&limit=1`);
}

async function loadWatch(id) {
  return sbGet(`capstan_watches?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
}

async function loadPin(id) {
  return sbGet(`treenails?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
}

const PAGE_TITLES = {
  ...EXTRA_TITLES,
  folio: 'folio — a local file, filed',
  ledger: 'ledger — addresses, not drawers',
  stemson: 'stemson — rankvault',
  gammon: 'gammon — rankvault',
  knighthead: 'knighthead — rankvault',
  cathead: 'cathead — rankvault',
  hawse: 'hawse — rankvault',
  futtock: 'futtock — rankvault',
  samson: 'samson — rankvault',
  pintle: 'pintle — a margin beside the file',
  bobstay: 'bobstay — ask for a file',
  keelson: 'keelson — a handoff, not a drawer',
  garboard: 'garboard — a seam between two drops',
  sternpost: 'sternpost — a berth for one file',
  breasthook: 'breasthook — problem, change, proof',
  treenail: 'treenail — a pin, not a drawer',
};
const PAGE_DESC_EXTRA = {
  folio: 'Drop a local file into the share table. Discord unfurls /s. Large drops are warned, never refused.',
  ledger: 'Pin an address on the links shelf. Not a file cabinet. Discord unfurls /ledger.',
  stemson: 'send local files into the share database. discord cards on every link. no size cap.',
  gammon: 'a shared room for local files. each drop still unfurls on discord.',
  knighthead: 'a sha-256 receipt filed to the share database.',
  cathead: 'the public log of files already landed.',
  hawse: 'file several local files as one parcel. the link unfurls on discord.',
  futtock: 'a reading desk. text files land in the share database with an excerpt on the card.',
  samson: 'paint the title, caption, and accent on a filed drop before you paste it in discord.',
  pintle: 'file a local drop, then leave a margin beside it. discord unfurls /s and /pintle. large drops are warned, never refused.',
  bobstay: 'ask for a file. an answer lands in the share table. discord unfurls /bobstay.',
  keelson: 'hand a local file to someone by name. bytes land in the share table. discord unfurls /keelson.',
  garboard: 'note the seam between two files already filed. discord unfurls /garboard.',
  sternpost: 'name a berth and file a local drop into the share table. discord unfurls /sternpost. large drops are warned, never refused.',
  breasthook: 'a three-line brief filed as markdown, with an optional local attachment. discord unfurls /breasthook.',
  treenail: 'name why a drop exists. an optional local file lands in the share table. discord unfurls /treenail. large drops are warned, never refused.',
};
const PAGE_DESC = { ...EXTRA_DESC };

function pageHtml({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="${esc(c)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(safeImg)}" /><meta property="og:image:secure_url" content="${esc(safeImg)}" /><meta property="og:image:alt" content="${esc(title)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(safeImg)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p><script>if(!/discord|bot|embed|preview/i.test(navigator.userAgent||'')) location.replace(${JSON.stringify(url)});</script></body></html>`;
}

function sendCard(res, ua, embedFlag, dest, card) {
  if (!isBot(ua) && embedFlag !== '1') {
    res.status(302).setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(pageHtml(card));
}

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || '').toString().trim().toLowerCase();
  const room = (req.query.room || '').toString().trim();
  const parcel = (req.query.parcel || '').toString().trim();
  const ask = (req.query.ask || '').toString().trim();
  const receipt = (req.query.receipt || '').toString().trim();
  const pin = (req.query.pin || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = req.headers['user-agent'];

  if (pin && (page === 'treenail' || page === 'capstan')) {
    const row = page === 'treenail' ? await loadPin(pin) : await loadWatch(pin);
    const dest = `${proto}://${host}/${page}/${encodeURIComponent(pin)}`;
    const title = row ? `${row.label || row.title || 'pin'} — ${page}` : `${page} — rankvault`;
    const desc = row
      ? `${row.note ? row.note + ' · ' : ''}${row.file_name || 'note only'}${row.share_id ? ' · filed' : ''}`
      : 'a pin beside the share table. not a drawer.';
    let image;
    if (row && row.share_id) {
      const share = await loadShare(row.share_id);
      if (share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '')) image = share.file_url;
    }
    sendCard(res, ua, req.query.embed, dest, { title, desc, image, url: dest, color: (row && row.accent) || '#30D158' });
    return;
  }

  if (receipt) {
    const row = await loadReceipt(receipt);
    const dest = `${proto}://${host}/keelson/${encodeURIComponent(receipt)}`;
    const title = row ? `${row.file_name || 'file'} — for ${row.to_name || 'someone'}` : 'keelson — rankvault';
    const desc = row
      ? `${row.note ? row.note + ' · ' : ''}from ${row.from_name || 'keelson'} · ${prettySize(row.size)} · handoff on rankvault`
      : 'a named handoff. the file lives in the share table.';
    sendCard(res, ua, req.query.embed, dest, { title, desc, url: dest, color: '#0A84FF' });
    return;
  }

  if (ask) {
    const row = await loadAsk(ask);
    const dest = `${proto}://${host}/bobstay/${encodeURIComponent(ask)}`;
    const title = row ? `${row.title} — bobstay` : 'bobstay — rankvault';
    const desc = row
      ? `${row.note ? row.note + ' · ' : ''}${row.fulfilled_share_id ? 'answered' : 'open ask'}${row.author ? ' · ' + row.author : ''}`
      : 'a request for a file. answers land in the share table.';
    sendCard(res, ua, req.query.embed, dest, { title, desc, url: dest, color: '#0A84FF' });
    return;
  }

  if (parcel && !id) {
    const row = await loadParcel(parcel);
    const dest = `${proto}://${host}/#hawse?f=${encodeURIComponent(parcel)}`;
    const count = row && Array.isArray(row.items) ? row.items.length : 0;
    const title = row ? `${row.title || 'parcel'} — rankvault` : 'hawse parcel — rankvault';
    const desc = row
      ? `${row.note ? row.note + ' · ' : ''}${count} file${count === 1 ? '' : 's'} filed in the share table`
      : 'a pack of filed files. discord cards on the drops inside.';
    const image = row && Array.isArray(row.items)
      ? (row.items.find((it) => String(it.mime || '').startsWith('image/') && /^https?:\/\//i.test(it.file_url || '')) || {}).file_url
      : undefined;
    sendCard(res, ua, req.query.embed, dest, { title, desc, image, url: dest, color: (row && row.accent) || '#0A84FF' });
    return;
  }

  if (room && !id) {
    const dest = `${proto}://${host}/#gammon?f=${encodeURIComponent(room)}`;
    sendCard(res, ua, req.query.embed, dest, { title: 'gammon room — rankvault', desc: 'a shared file room. discord cards on the drops inside.', url: dest, color: '#0A84FF' });
    return;
  }

  if (page && !id) {
    const dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    const title = PAGE_TITLES[page] || `${page} — rankvault`;
    const desc = PAGE_DESC[page] || PAGE_DESC_EXTRA[page] || 'quiet file hosting. drop a file, share only if you want. discord cards on every link.';
    sendCard(res, ua, req.query.embed, dest, { title, desc, url: dest, color: '#0A84FF' });
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
    ? `${caption ? caption + ' · ' : ''}${kind} · ${prettySize(row.size)}${row.author ? ' · ' + row.author : ''} · public drop on rankvault`
    : 'a quiet file drop. open to download.';
  const mime = String((live && row.mime) || '');
  const fileUrl = String((live && row.file_url) || '');
  const image = live && mime.startsWith('image/') && /^https?:\/\//i.test(fileUrl) ? fileUrl : undefined;
  const accent = live && row.meta && row.meta.color ? String(row.meta.color) : '#0A84FF';
  sendCard(res, ua, req.query.embed, appUrl, { title, desc, image, url: appUrl, color: accent });
}
