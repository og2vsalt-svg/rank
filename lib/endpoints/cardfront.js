const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  folio: 'a reading copy of a local file. bytes land in storage, the row stays in folios.',
  swatch: 'colors pulled from a local image, with the file kept beside the chips.',
  margin: 'notes in the margin of a share. not a file cabinet.',
  vault: 'local-first files. public drops go to the share table. large files are warned, never refused.',
  courier: 'a local file filed to the drops bucket and the hosted_files table. no size cap, only a slowness note.',
  keepsake: 'a local file filed to storage and the keepsakes table. discord cards on /keepsake/id.',
  passage: 'a timing desk for a local file. large drops are warned, never refused.',
  cardroom: 'rewrite the discord card on a share that is already filed.',
  linen: 'a local file folded for someone. the label lives in linen_press.',
  stillroom: 'a short note, not a file. the row lives in stillroom_notes.',
  home: 'private file hosting. discord cards on every link, including this one.',
  pallet: 'several local files, one slip. each file lands in the share table. large drops are warned, never refused.',
  unfurl: 'preview the discord card for any rankvault link before you paste it.',
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

  if (page === 'linen' && id) {
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
