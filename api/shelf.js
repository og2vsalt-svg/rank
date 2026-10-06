function esc(s) {
  const amp = String.fromCharCode(38);
  const lt = String.fromCharCode(60);
  const gt = String.fromCharCode(62);
  const q = String.fromCharCode(34);
  return String(s || '')
    .split(amp).join(amp + 'amp;')
    .split(lt).join(amp + 'lt;')
    .split(gt).join(amp + 'gt;')
    .split(q).join(amp + 'quot;');
}

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const COPY = {
  plinth: ['Plinth — rankvault', 'A dedication under a local file. The file lands in the share table. Large drops are warned, never refused.'],
  corbel: ['Corbel — rankvault', 'A load note for a local file. Paste the link in Discord for a card.'],
  ashlar: ['Ashlar — rankvault', 'A letter with an optional local file. Large drops are warned, never refused.'],
  tympanum: ['Tympanum — rankvault', 'The public face of files already in the share table. Paste the link in Discord for a card.'],
  nosing: ['Nosing — rankvault', 'A due slip on the edge of a local file. The file lands in the share table. No size gate.'],
  trundle: ['Trundle — rankvault', 'A handoff slip with a local file in the share table. Large drops are warned, never refused.'],
  coping: ['Coping — rankvault', 'A checklist beside an optional local file. Paste the link in Discord for a card.'],
  keepsake: ['Keepsake — rankvault', 'A local file filed in the share table. Large drops are warned, never refused.'],
  lintel: ['Lintel — rankvault', 'A note or a local file under the door. Paste the link in Discord for a card.'],
  oriel: ['Oriel — rankvault', 'A short window note. The card uses the line itself.'],
  sill: ['Sill — rankvault', 'A short link, not a drawer. Paste /sill in Discord for a card.'],
  vitrine: ['Vitrine — rankvault', 'Dress a Discord card, then drop the local file into the shared shelf. Large files are warned, never refused.'],
  pressmark: ['Pressmark — rankvault', 'A painted 1200×630 cover, filed so Discord can unfurl a real image.'],
  shelf: ['Shelf — rankvault', 'Drop a local file into the shared shelf. Large files are warned, never refused.'],
  board: ['Board — rankvault', 'Public files people left out. Paste the link in Discord for a card.'],
  receipt: ['Receipt — rankvault', 'A short handoff note that travels with the link.'],
  satchel: ['Satchel — rankvault', 'A local file packed with a checklist. Paste the link in Discord for a card.'],
  home: ['rankvault', 'Private file hosting. Share a file, keep the older desks, Discord cards on every link.'],
};

function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1048576) return Math.round(x / 1024) + ' KB';
  return (x / 1048576).toFixed(1) + ' MB';
}

export default async function handler(req, res) {
  const page = String(req.query.page || req.query.name || 'shelf');
  const id = String(req.query.id || '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app');
  const url = proto + '://' + host + '/' + page + (id ? '/' + encodeURIComponent(id) : '');
  let title = (COPY[page] || COPY.home)[0];
  let desc = (COPY[page] || COPY.home)[1];
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';

  if (id && (page === 'board' || page === 's' || page === 'shelf' || page === 'keepsake')) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/public_shares?id=eq.' + encodeURIComponent(id) + '&select=name,caption,size,mime,file_url&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows[0];
      if (row) {
        title = row.name;
        desc = (row.caption || 'shared file') + ' · ' + prettySize(row.size);
        if (String(row.mime || '').indexOf('image/') === 0 && /^https?:/i.test(row.file_url || '')) image = row.file_url;
      }
    }
  }

  if (id && page === 'plinth') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/plinth_stones?id=eq.' + encodeURIComponent(id) + '&select=place,dedication,file_name,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = row.place + ' — plinth';
        desc = (row.dedication || row.file_name || 'dedication') + (row.author ? ' · ' + row.author : '');
      }
    }
  }

  if (id && page === 'corbel') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/corbel_notes?id=eq.' + encodeURIComponent(id) + '&select=load_note,bearer,file_name,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = (row.bearer || row.file_name || 'load') + ' — corbel';
        desc = (row.load_note || 'load note') + (row.author ? ' · ' + row.author : '');
      }
    }
  }

  if (id && page === 'trundle') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/trundle_slips?id=eq.' + encodeURIComponent(id) + '&select=to_name,note,file_name,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = 'for ' + row.to_name + ' — trundle';
        desc = (row.note || row.file_name || 'handoff') + (row.author ? ' · ' + row.author : '');
      }
    }
  }

  if (id && page === 'coping') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/coping_lists?id=eq.' + encodeURIComponent(id) + '&select=title,items,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        const items = Array.isArray(row.items) ? row.items.slice(0, 4).join(', ') : '';
        title = row.title + ' — coping';
        desc = (items || 'a checklist') + (row.author ? ' · ' + row.author : '');
      }
    }
  }

  if (id && page === 'satchel') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/satchels?id=eq.' + encodeURIComponent(id) + '&select=title,note,file_name,size,mime,file_url&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows[0];
      if (row) {
        title = row.title || row.file_name || 'Satchel';
        desc = (row.note || 'packed file') + ' · ' + prettySize(row.size);
        if (String(row.mime || '').indexOf('image/') === 0 && /^https?:/i.test(row.file_url || '')) image = row.file_url;
      }
    }
  }

  if (id && page === 'receipt') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/receipts?id=eq.' + encodeURIComponent(id) + '&select=name,note,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows[0];
      if (row) {
        title = row.name + ' — receipt';
        desc = row.note || 'a handoff note';
      }
    }
  }

  if (id && (page === 'sill' || page === 'lintel')) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/links?id=eq.' + encodeURIComponent(id) + '&select=url,note,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = (row.note || 'link') + ' — rankvault';
        desc = row.url + (row.author ? ' · ' + row.author : '');
      }
    }
  }

  if (id && page === 'ashlar') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/ashlar_letters?id=eq.' + encodeURIComponent(id) + '&select=title,body,author,share_id&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = row.title + ' — ashlar';
        desc = String(row.body || '').slice(0, 180) + (row.author ? ' · ' + row.author : '');
      }
    }
  }

  if (id && page === 'nosing') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/nosing_slips?id=eq.' + encodeURIComponent(id) + '&select=title,due_note,file_name,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = row.title + ' — nosing';
        desc = (row.due_note || row.file_name || 'due slip') + (row.author ? ' · ' + row.author : '');
      }
    }
  }

  if (id && page === 'tympanum') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/public_shares?id=eq.' + encodeURIComponent(id) + '&select=name,caption,size,mime,file_url&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = (row.caption || row.name) + ' — tympanum';
        desc = prettySize(row.size);
        if (String(row.mime || '').indexOf('image/') === 0 && /^https?:/i.test(row.file_url || '')) image = row.file_url;
      }
    }
  }

  if (id && (page === 'outbox' || page === 'postbag')) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/outbox_drops?id=eq.' + encodeURIComponent(id) + '&select=name,note,size,mime,file_url,sent_to,author&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = row.name + ' — outbox';
        desc = (row.note || 'a sent file') + (row.sent_to ? ' · for ' + row.sent_to : '') + (row.author ? ' · ' + row.author : '');
        if (String(row.mime || '').indexOf('image/') === 0 && /^https?:/i.test(row.file_url || '')) image = row.file_url;
      }
    }
  }

  if (id && page === 'oriel') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/whispers?id=eq.' + encodeURIComponent(id) + '&select=body,author,kind&limit=1', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (r.ok) {
      const rows = await r.json();
      const row = rows && rows[0];
      if (row) {
        title = (row.kind || 'note') + ' — oriel';
        desc = row.body + (row.author ? ' · ' + row.author : '');
      }
    }
  }

  const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><meta property="og:type" content="website"><meta property="og:site_name" content="rankvault"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(image) + '"><meta property="og:url" content="' + esc(url) + '"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0A84FF"></head><body style="background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;padding:48px"><h1>' + esc(title) + '</h1><p>' + esc(desc) + '</p></body></html>';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(html);
}
