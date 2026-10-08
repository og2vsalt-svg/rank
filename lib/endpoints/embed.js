import { EXTRA_TITLES, EXTRA_DESC } from '../deskCards.js';

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
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider|redditbot|applebot|discordbot|iframely|unfurl|pinterest|notion|teams|slack-imgproxy/i.test(ua || '');
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

const PAGE_TITLES = { ...EXTRA_TITLES };
const PAGE_DESC = { ...EXTRA_DESC };

function pageHtml({ title, desc, image, url, color }) {
  const fallback = 'https://og2vsalt-svg.github.io/rank/og.png';
  const safeImg = image && /^https?:\/\//i.test(image) && !image.startsWith('data:') ? image : fallback;
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="${esc(c)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(safeImg)}" /><meta property="og:image:secure_url" content="${esc(safeImg)}" /><meta property="og:image:alt" content="${esc(title)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(safeImg)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
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
  const parcel = (req.query.parcel || '').toString().trim();
  const ask = (req.query.ask || '').toString().trim();
  const receipt = (req.query.receipt || '').toString().trim();
  const pin = (req.query.pin || '').toString().trim();
  const check = (req.query.check || '').toString().trim();
  const room = (req.query.room || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const ua = req.headers['user-agent'];

  if (page === 'larder') {
    const dest = `${proto}://${host}/larder`;
    sendCard(res, ua, req.query.embed, dest, {
      title: 'larder — rankvault',
      desc: 'upload a local file to the share table. no size cap, only a warning if it may be slow.',
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (page === 'pinboard') {
    const dest = `${proto}://${host}/pinboard`;
    sendCard(res, ua, req.query.embed, dest, {
      title: 'pinboard — rankvault',
      desc: 'a public board of links. not a file cabinet.',
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'bollard') {
    const dest = `${proto}://${host}/bollard`;
    sendCard(res, ua, req.query.embed, dest, {
      title: 'bollard — rankvault',
      desc: 'tie a local file to a public link. large drops are warned, never refused. discord cards on every share.',
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (page === 'unfurl' && id) {
    const row = await loadShare(id);
    const dest = `${proto}://${host}/unfurl/${encodeURIComponent(id)}`;
    const live = row && row.is_public && !(row.expires_at && +new Date(row.expires_at) < Date.now());
    sendCard(res, ua, req.query.embed, dest, {
      title: live ? ((row.meta && row.meta.cardTitle) || row.name) : 'unfurl — rankvault',
      desc: live ? (row.caption || `${prettySize(row.size)} · public drop on rankvault`) : 'preview the discord card for a share.',
      image: live && /^image\//.test(row.mime || '') ? row.file_url : undefined,
      url: dest,
      color: (live && row.meta && row.meta.color) || '#0A84FF',
    });
    return;
  }
  if (page === 'unfurl') {
    const dest = `${proto}://${host}/unfurl`;
    sendCard(res, ua, req.query.embed, dest, {
      title: 'unfurl — rankvault',
      desc: 'preview the discord card on a share link before you send it.',
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
    if (page === 'passage' && id) {
    const row = await sbGet(`passages?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/passage/${encodeURIComponent(id)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.file_name || 'file'} for ${row.to_name}` : 'passage — rankvault',
      desc: row ? `${row.note || 'a named handoff'} · ${prettySize(row.size)}` : 'a named handoff. large files are warned, never refused.',
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'lantern') {
    const dest = `${proto}://${host}/lantern`;
    sendCard(res, ua, req.query.embed, dest, {
      title: 'lantern — rankvault',
      desc: 'a short note on the board. not a file cabinet.',
      url: dest,
      color: '#FFD60A',
    });
    return;
  }
  if (page === 'sounding' && id) {
    const row = await sbGet(`soundings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/sounding/${encodeURIComponent(id)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.ok ? 'answered' : 'no answer'} — sounding` : 'sounding — rankvault',
      desc: row ? `${row.target} · ${row.status_code || 0} · ${row.elapsed_ms || 0} ms` : 'a reading, not a drawer.',
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'orlop' && id) {
    const row = await sbGet(`handoffs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/orlop/${encodeURIComponent(id)}`;
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.recipient || 'handoff'} — ${row.name}` : 'orlop — rankvault',
      desc: row ? `${row.note || 'a locker receipt'} · ${prettySize(row.size)}` : 'a locker under the vault. large files are warned, never refused.',
      image,
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (page === 'cleat') {
    const dest = `${proto}://${host}/cleat`;
    sendCard(res, ua, req.query.embed, dest, {
      title: 'cleat — rankvault',
      desc: 'pin an address on the rail. not a file cabinet.',
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'marline' && id) {
    const row = await sbGet(`marlines?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/marline/${encodeURIComponent(id)}`;
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.watch} watch — ${row.name}` : 'marline — rankvault',
      desc: row ? `${row.entry} · ${prettySize(row.size)}` : 'a log line and a file. not a drawer.',
      image,
      url: dest,
      color: '#30D158',
    });
    return;
  }
  if (page === 'deadeye' && id) {
    const row = await sbGet(`deadeyes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/deadeye/${encodeURIComponent(id)}`;
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.witness} — ${row.name}` : 'deadeye — rankvault',
      desc: row ? `${row.saw} · ${prettySize(row.size)}` : 'a witness and a file. not a drawer.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'hounds' && id) {
    const row = await sbGet(`hounds?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/hounds/${encodeURIComponent(id)}`;
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.line} — ${row.name}` : 'hounds — rankvault',
      desc: row ? `${row.note ? row.note + ' · ' : ''}${prettySize(row.size)}` : 'a line and a file. not a drawer.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (check || (page === 'fairlead' && id)) {
    const key = check || id;
    const row = await sbGet(`fairlead_checks?id=eq.${encodeURIComponent(key)}&select=*&limit=1`);
    const dest = `${proto}://${host}/fairlead/${encodeURIComponent(key)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.title} — fairlead` : 'fairlead — rankvault',
      desc: row ? (row.note || 'a checklist beside the share table.') : 'a checklist, not a drawer.',
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (pin && (page === 'treenail' || page === 'capstan')) {
    const row = page === 'treenail'
      ? await sbGet(`treenails?id=eq.${encodeURIComponent(pin)}&select=*&limit=1`)
      : await sbGet(`capstan_watches?id=eq.${encodeURIComponent(pin)}&select=*&limit=1`);
    const dest = `${proto}://${host}/${page}/${encodeURIComponent(pin)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.label || row.title || 'pin'} — ${page}` : `${page} — rankvault`,
      desc: row ? (row.note || row.file_name || 'a pin beside the share table.') : 'a pin, not a drawer.',
      url: dest,
      color: '#30D158',
    });
    return;
  }
  if (receipt) {
    const row = await sbGet(`keelson_receipts?id=eq.${encodeURIComponent(receipt)}&select=*&limit=1`);
    const dest = `${proto}://${host}/keelson/${encodeURIComponent(receipt)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.file_name || 'file'} — for ${row.to_name || 'someone'}` : 'keelson — rankvault',
      desc: row ? `from ${row.from_name || 'keelson'} · ${prettySize(row.size)}` : 'a named handoff.',
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (ask) {
    const row = await sbGet(`file_requests?id=eq.${encodeURIComponent(ask)}&select=*&limit=1`);
    const dest = `${proto}://${host}/bobstay/${encodeURIComponent(ask)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.title} — bobstay` : 'bobstay — rankvault',
      desc: row ? (row.note || 'a request for a file.') : 'a request for a file.',
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (parcel && !id) {
    const dest = `${proto}://${host}/#hawse?f=${encodeURIComponent(parcel)}`;
    sendCard(res, ua, req.query.embed, dest, { title: 'hawse parcel — rankvault', desc: 'a pack of filed files.', url: dest, color: '#0A84FF' });
    return;
  }
  if (room && !id) {
    const dest = `${proto}://${host}/#gammon?f=${encodeURIComponent(room)}`;
    sendCard(res, ua, req.query.embed, dest, { title: 'gammon room — rankvault', desc: 'a shared file room.', url: dest, color: '#0A84FF' });
    return;
  }
  if (page === 'counter' && id) {
    const row = await sbGet(`counter_marks?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/counter/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.mark} — counter` : 'counter — rankvault',
      desc: row ? `${row.for_whom ? 'for ' + row.for_whom + ' · ' : ''}${share ? prettySize(share.size) + ' · ' : ''}a mark under the stern` : 'a mark, not a drawer.',
      image,
      url: dest,
      color: (row && row.hue) || '#5AC8FA',
    });
    return;
  }
  if (page === 'rider' && id) {
    const row = await sbGet(`riders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/rider/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.timber} — rider` : 'rider — rankvault',
      desc: row ? `${row.note ? row.note + ' · ' : ''}${share ? prettySize(share.size) + ' · ' : ''}a brace, not a drawer` : 'a timber note beside a filed file.',
      image,
      url: dest,
      color: '#FF9F0A',
    });
    return;
  }
  if (page === 'scupper' && id) {
    const row = await sbGet(`scupper_drips?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/scupper/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.drain} — scupper` : 'scupper — rankvault',
      desc: row ? `${row.where_to ? 'to ' + row.where_to + ' · ' : ''}${share ? prettySize(share.size) + ' · ' : ''}a drain, not a drawer` : 'a drain note beside a filed file.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'futtock' && id) {
    const row = await sbGet(`futtocks?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/futtock/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.file_name} — futtock` : 'futtock — rankvault',
      desc: row ? `${row.note || 'a rib beside a filed file'}${row.for_whom ? ' · for ' + row.for_whom : ''}` : 'a rib, not a drawer. large files are warned, never refused.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'stringer' && id) {
    const row = await sbGet(`carling_lines?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/stringer/${encodeURIComponent(id)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.line} — stringer` : 'stringer — rankvault',
      desc: row ? `${row.author || 'stringer'}${row.share_id ? ' · ' + row.share_id : ''}` : 'a line along a file that already landed.',
      url: dest,
      color: '#FFD60A',
    });
    return;
  }
  if (page === 'bumkin' && id) {
    const row = await sbGet(`bumkins?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/bumkin/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    const when = row && row.return_by ? new Date(row.return_by).toLocaleString() : '';
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.file_name} — bumkin` : 'bumkin — rankvault',
      desc: row ? `${row.note || 'a timed handoff'}${when ? ' · back by ' + when : ''}` : 'a return date, not a drawer. large files are warned, never refused.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'apostle' && id) {
    const row = await sbGet(`apostles?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/apostle/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.file_name} — apostle` : 'apostle — rankvault',
      desc: row ? `${row.spoken || 'a spoken line beside a filed file'}${row.witness ? ' · heard by ' + row.witness : ''}` : 'a timber beside the keel, not a drawer.',
      image,
      url: dest,
      color: '#FFD60A',
    });
    return;
  }
  if (page === 'knee' && id) {
    const row = await sbGet(`knees?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/knee/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.file_name} — knee` : 'knee — rankvault',
      desc: row ? `${row.angle_note || 'a join beside a filed file'}${row.mate ? ' · braces ' + row.mate : ''}` : 'a join, not a drawer. large files are warned, never refused.',
      image,
      url: dest,
      color: '#FFD60A',
    });
    return;
  }
  if (page === 'transom' && id) {
    const row = await sbGet(`transoms?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/transom/${encodeURIComponent(id)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.verdict || 'weighed'} — transom` : 'transom — rankvault',
      desc: row ? `${row.note || 'two shares, weighed'}` : 'a weighing, not a drawer.',
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'tumblehome' && id) {
    const row = await sbGet(`tumblehomes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/tumblehome/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.file_name} — tumblehome` : 'tumblehome — rankvault',
      desc: row ? (row.lean || 'a local file with a lean') : 'a lean, not a drawer. large files are warned, never refused.',
      image,
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (page === 'washstrake' && id) {
    const row = await sbGet(`washstrakes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/washstrake/${encodeURIComponent(id)}`;
    const share = row && row.left_share_id ? await loadShare(row.left_share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.left_name} beside ${row.right_name}` : 'washstrake — rankvault',
      desc: row ? (row.difference || 'two local files, compared') : 'a pair, not a drawer. large files are warned, never refused.',
      image,
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (page === 'waterway' && id) {
    const row = await sbGet(`waterways?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/waterway/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.title} — waterway` : 'waterway — rankvault',
      desc: row ? String(row.border || '').slice(0, 180) : 'a gutter, not a drawer.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
    if (page === 'sheerstrake' && id) {
    const row = await sbGet(`sheerstrakes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/sheerstrake/${encodeURIComponent(id)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.title} — sheerstrake` : 'sheerstrake — rankvault',
      desc: row ? String(row.letter || '').slice(0, 180) : 'a letter, not a drawer.',
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
    if (page === 'kedge' && id) {
    const row = await sbGet(`kedges?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/kedge/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.hold} — kedge` : 'kedge — rankvault',
      desc: row ? `${row.destination}${row.note ? ' · ' + String(row.note).slice(0, 140) : ''}` : 'an anchor, not a drawer. large files are warned, never refused.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'binnacle') {
    const dest = `${proto}://${host}/#binnacle`;
    sendCard(res, ua, req.query.embed, dest, {
      title: 'binnacle — rankvault',
      desc: 'a compass of public drops already in the share table. not another drawer.',
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (page === 'wale' && id) {
    const row = await sbGet(`wales?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/wale/${encodeURIComponent(id)}`;
    const share = row && row.share_id ? await loadShare(row.share_id) : null;
    const image = share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '') ? share.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.plank} — wale` : 'wale — rankvault',
      desc: row ? `${row.file_name || 'file'}${row.note ? ' · ' + String(row.note).slice(0, 140) : ''}` : 'a plank receipt, not a drawer. large files are warned, never refused.',
      image,
      url: dest,
      color: '#64D2FF',
    });
    return;
  }
  if (page === 'flemish' && id) {
    const row = await sbGet(`flemish?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/flemish/${encodeURIComponent(id)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.title} — flemish` : 'flemish — rankvault',
      desc: row ? (row.blurb || row.target) : 'a link card, not a file cabinet.',
      url: dest,
      color: (row && row.accent) || '#30D158',
    });
    return;
  }
  if ((page === 'palimpsest' || page === 'underwriting') && id) {
    const row = await sbGet(`palimpsests?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/palimpsest/${encodeURIComponent(id)}`;
    const image = row && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${row.title || row.file_name || 'later writing'} — palimpsest` : 'palimpsest — rankvault',
      desc: row ? `${row.later || row.scraped || 'a later writing over an earlier file'} · ${prettySize(row.size)}` : 'a later writing, not a drawer. large files are warned, never refused.',
      image,
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (page === 'footnote' && id) {
    const row = await sbGet(`footnotes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const dest = `${proto}://${host}/footnote/${encodeURIComponent(id)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: row ? `${(row.author || 'footnote')} — footnote` : 'footnote — rankvault',
      desc: row ? String(row.body || '').slice(0, 180) : 'a margin note, not a file drawer.',
      url: dest,
      color: '#FFD60A',
    });
    return;
  }
  if (page === 'mailslot' && id) {
    const row = await loadShare(id);
    const dest = `${proto}://${host}/s/${encodeURIComponent(id)}`;
    const live = row && row.is_public && !(row.expires_at && +new Date(row.expires_at) < Date.now());
    const image = live && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
    sendCard(res, ua, req.query.embed, dest, {
      title: live ? ((row.meta && row.meta.cardTitle) || row.name) : 'mailslot — rankvault',
      desc: live ? (row.caption || `${prettySize(row.size)} · posted through the mail slot`) : 'a local file posted into the share table. large drops are warned, never refused.',
      image,
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (page && !id) {
    const dest = `${proto}://${host}/${encodeURIComponent(page)}`;
    sendCard(res, ua, req.query.embed, dest, {
      title: PAGE_TITLES[page] || `${page} — rankvault`,
      desc: PAGE_DESC[page] || 'quiet file hosting. discord cards on every link.',
      url: dest,
      color: '#0A84FF',
    });
    return;
  }
  if (!id) {
    res.status(302).setHeader('Location', '/');
    res.end();
    return;
  }
  const row = await loadShare(id);
  const live = row && row.is_public && (!row.expires_at || +new Date(row.expires_at) > Date.now());
  const appUrl = `${proto}://${host}/s/${encodeURIComponent(id)}`;
  const image = live && String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '') ? row.file_url : undefined;
  sendCard(res, ua, req.query.embed, appUrl, {
    title: live ? ((row.meta && row.meta.cardTitle) || row.name) : 'rankvault drop',
    desc: live ? `${prettySize(row.size)} · public drop on rankvault` : 'a quiet file drop. open to download.',
    image,
    url: appUrl,
    color: (live && row.meta && row.meta.color) || '#0A84FF',
  });
}
