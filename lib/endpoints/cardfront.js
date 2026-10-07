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

function html({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '" /><meta name="theme-color" content="' + esc(c) + '" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="' + esc(title) + '" /><meta property="og:description" content="' + esc(desc) + '" /><meta property="og:image" content="' + esc(safeImg) + '" /><meta property="og:image:secure_url" content="' + esc(safeImg) + '" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:type" content="image/png" /><meta property="og:image:alt" content="rankvault" /><meta property="og:url" content="' + esc(url) + '" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="' + esc(title) + '" /><meta name="twitter:description" content="' + esc(desc) + '" /><meta name="twitter:image" content="' + esc(safeImg) + '" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:64px 28px"><p style="opacity:.5;letter-spacing:.12em;text-transform:uppercase;font-size:12px">rankvault</p><h1 style="letter-spacing:-.04em;font-size:34px">' + esc(title) + '</h1><p style="color:#a1a1aa;max-width:42rem">' + esc(desc) + '</p></body></html>';
}

const BLURBS = {
  dossier: 'a local file filed to the dossier desk. discord cards on /dossier/id. large drops are warned, never refused.',
  folio: 'a reading copy of a local file. bytes land in storage, the row stays in folios.',
  swatch: 'colors pulled from a local image, with the file kept beside the chips.',
  margin: 'notes in the margin of a share. not a file cabinet.',
  vault: 'local-first files. public drops go to the share table. large files are warned, never refused.',
  courier: 'a local file filed to the drops bucket and the hosted_files table. no size cap, only a slowness note.',
  keepsake: 'a local file filed to storage and the keepsakes table. discord cards on /keepsake/id.',
  dado: 'a local file pinned to a named room. bytes land in storage, the pin lives in dado_pins. no size cap.',
  passage: 'a timing desk for a local file. large drops are warned, never refused.',
  cardroom: 'rewrite the discord card on a share that is already filed.',
  linen: 'a local file folded for someone. the label lives in linen_press.',
  stillroom: 'a short note, not a file. the row lives in stillroom_notes.',
  home: 'private file hosting. discord cards on every link, including this one.',
  fieldbook: 'a page of notes. no file, no cabinet.',
  stile: 'a short link. the address opens after the card. causeway still files a local file.',
  pallet: 'several local files, one slip. each file lands in the share table. large drops are warned, never refused.',
  unfurl: 'preview the discord card for any rankvault link before you paste it.',
  parcel: 'a local file addressed to someone, with a return note. no size cap, only a slowness note.',
  satchel: 'a named bag of local files. each file is filed to the share table. large drops are warned, never refused.',
  copydesk: 'a typed slip, not a cabinet. the words live in copy_slips and unfurl on discord.',
  colophon: 'credits beside a local file. title, edition, imprint. no size cap, only a slowness note.',
  seal: 'a local file plus its sha-256. the digest and the bytes stay together. large drops are warned, never refused.',
  handover: 'a local file passed to the next person on a chain. discord cards on /handover/id.',
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

  if (page === 'inlay' && id) {
    const row = await sbGet('pressmarks?id=eq.' + encodeURIComponent(id) + '&select=name,mime,size,note,author,sha256&limit=1');
    if (row) {
      title = row.name + ' — inlay';
      desc = (row.note || 'a file kept in the inlay table') + ' · ' + prettySize(row.size) + (row.author ? ' · ' + row.author : '');
    }
  } else if (page === 'rack') {
    title = 'rack — rankvault';
    desc = 'files already written into the inlay table. open one for the download and the card.';
  } else if (page === 'parcel' && id) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row && row.meta && row.meta.desk === 'parcel') {
      title = 'parcel for ' + (row.meta.toName || 'someone');
      desc = (row.name || 'file') + ' · ' + prettySize(row.size) + (row.caption ? ' · ' + String(row.caption).slice(0, 160) : '');
      color = '#64D2FF';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (page === 'seal' && id) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row && row.meta && row.meta.desk === 'seal') {
      title = (row.name || 'file') + ' — seal';
      desc = 'sha-256 ' + String(row.meta.sha256 || '').slice(0, 16) + '… · ' + prettySize(row.size) + (row.caption ? ' · ' + String(row.caption).slice(0, 140) : '');
      color = '#30D158';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (page === 'handover' && id) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row && row.meta && row.meta.desk === 'handover') {
      title = 'handover for ' + (row.meta.nextName || 'someone');
      desc = 'step ' + (row.meta.step || 1) + ' · ' + (row.name || 'file') + ' · ' + prettySize(row.size);
      color = '#FF9F0A';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (page === 'colophon' && id) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row && row.meta && row.meta.desk === 'colophon') {
      title = (row.meta.title || row.name || 'colophon') + ' — colophon';
      desc = (row.meta.edition || 'an edition') + ' · ' + prettySize(row.size) + (row.caption ? ' · ' + String(row.caption).slice(0, 160) : '');
      color = '#AF52DE';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (id && !SHARE_PAGES.has(page)) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row && row.meta && row.meta.desk === page) {
      title = (row.meta.cardTitle || row.name || page) + ' — ' + page;
      desc = (row.caption || prettySize(row.size) + ' filed on rankvault') + (row.author ? ' · ' + row.author : '');
      color = row.meta.color || color;
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (page === 'linen' && id) {
    const row = await sbGet('linen_press?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.name || 'linen fold';
      desc = (row.receiver ? 'for ' + row.receiver + ' · ' : '') + (row.note || prettySize(row.size) + ' folded on rankvault');
      color = '#64D2FF';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (page === 'stillroom' && id) {
    const row = await sbGet('stillroom_notes?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.title || 'stillroom note';
      desc = (row.author ? row.author + ': ' : '') + String(row.body || '').slice(0, 180);
      color = '#FFD60A';
    }
  } else if (page === 'courier' && id) {
    const row = await sbGet('hosted_files?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.name || 'courier file';
      desc = row.note || prettySize(row.size) + ' filed on rankvault';
      if (row.mime && String(row.mime).startsWith('image/') && row.file_url) image = row.file_url;
    }
  } else if (page === 'folio' && id) {
    const row = await sbGet('folios?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.title + ' — folio';
      desc = (row.author ? row.author + ' · ' : '') + prettySize(row.size) + (row.excerpt ? ' · ' + String(row.excerpt).slice(0, 140) : '');
      if (/^image\//.test(row.mime || '')) image = row.file_url;
    }
  } else if (page === 'swatch' && id) {
    const row = await sbGet('swatches?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      const colors = Array.isArray(row.colors) ? row.colors : [];
      title = row.name + ' — swatch';
      desc = colors.length ? colors.slice(0, 5).join(' · ') : 'a palette pulled from a local image.';
      color = colors[0] || color;
      if (/^image\//.test(row.mime || '')) image = row.file_url;
    }
  } else if (page === 'margin' && id) {
    const row = await sbGet('margin_notes?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = 'margin on ' + row.share_id;
      desc = (row.author || 'someone') + ': ' + String(row.body).slice(0, 180);
      color = '#FFD60A';
    }
  } else if (page === 'dado' && id) {
    const row = await sbGet('dado_pins?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.title || row.file_name || 'dado') + ' — dado';
      desc = (row.room ? row.room + ' · ' : '') + prettySize(row.size) + (row.note ? ' · ' + String(row.note).slice(0, 160) : '') + (row.author ? ' · ' + row.author : '');
      color = row.accent || color;
      if (/^image\//.test(row.mime || '')) image = row.file_url;
    }
  } else if (page === 'keepsake' && id) {
    const row = await sbGet('keepsakes?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.title || row.file_name || 'keepsake';
      desc = (row.author ? row.author + ' · ' : '') + prettySize(row.size) + (row.note ? ' · ' + String(row.note).slice(0, 160) : '');
      color = row.accent || color;
      if (/^image\//.test(row.mime || '')) image = row.file_url;
    }
  } else if (page === 'pallet' && id) {
    const row = await sbGet('pallets?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    const share = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    const pieces = row && Array.isArray(row.pieces) ? row.pieces : [];
    title = (row && row.receiver ? 'pallet for ' + row.receiver : (share && share.meta && share.meta.cardTitle) || 'pallet');
    desc = (row && row.note) || (share && share.caption) || (pieces.length ? pieces.length + ' files on one slip' : 'a pallet on rankvault');
    if (row && row.author) desc = desc + ' · ' + row.author;
    const imagePiece = pieces.find((p) => p && String(p.mime || '').indexOf('image/') === 0 && p.url);
    if (imagePiece) image = imagePiece.url;
  } else if (page === 'unfurl') {
    title = 'Unfurl — rankvault';
    desc = 'preview the discord card for any rankvault link before you paste it.';
  } else if (page === 'fieldbook' && id) {
    const row = await sbGet('fieldbook_notes?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.title || 'fieldbook';
      desc = (row.body || '').slice(0, 180) || 'a page on rankvault';
      if (row.place) desc = row.place + ' · ' + desc;
    }
  } else if (page === 'dossier' && id) {
    const row = await sbGet('dossiers?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.title + ' — dossier';
      desc = (row.caption || row.name || 'a filed document') + (row.author ? ' · ' + row.author : '');
      if (row.mime && String(row.mime).indexOf('image/') === 0 && row.file_url) image = row.file_url;
    }
  } else if (page === 'satchel' && id) {
    const row = await sbGet('satchels?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      const pieces = Array.isArray(row.pieces) ? row.pieces : [];
      title = row.title + ' — satchel';
      desc = (row.cover || (pieces.length + ' files in one bag')) + (row.author ? ' · ' + row.author : '');
      color = row.accent || color;
      const imagePiece = pieces.find((piece) => piece && String(piece.mime || '').indexOf('image/') === 0 && piece.url);
      if (imagePiece) image = imagePiece.url;
    }
  } else if (page === 'copydesk' && id) {
    const row = await sbGet('copy_slips?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.title + ' — copy desk';
      desc = String(row.body || '').slice(0, 180) + (row.author ? ' · ' + row.author : '');
      color = row.accent || color;
    }
  } else if (page === 'stile' && id) {
    const row = await sbGet('relays?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = row.label || 'stile';
      desc = row.note || row.target || 'a short link on rankvault';
    }
  } else if (id && SHARE_PAGES.has(page)) {
    const row = await sbGet('public_shares?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
    if (row) {
      title = (row.meta && row.meta.cardTitle) || row.name || 'share';
      desc = row.caption || prettySize(row.size) + ' · public drop on rankvault';
      if (/^image\//.test(row.mime || '')) image = row.file_url;
      color = (row.meta && row.meta.color) || color;
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html({ title, desc, image, url: dest, color }));
}
