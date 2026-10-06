function prettySize(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return Math.max(1, Math.round(x / 1024)) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

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
    .replace(/"/g, amp + 'quot;');
}

function isBot(ua) {
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider|redditbot|applebot|discordbot|iframely|unfurl|pinterest|notion|teams|slack-imgproxy/i.test(ua || '');
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

function pageHtml({ title, desc, url, color }) {
  const image = 'https://og2vsalt-svg.github.io/rank/og.png';
  const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#0A84FF';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="${esc(c)}" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(image)}" /><meta property="og:image:secure_url" content="${esc(image)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(image)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:64px 28px"><p style="opacity:.55;font-size:13px;letter-spacing:.08em;text-transform:uppercase">rankvault</p><h1 style="font-size:32px;letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p></body></html>`;
}

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const page = (req.query.page || 'handoff').toString().trim().toLowerCase();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const origin = `${proto}://${host}`;
  const ua = req.headers['user-agent'] || '';
  const embedFlag = (req.query.embed || '').toString();
  const dest = id ? `${origin}/${page}/${encodeURIComponent(id)}` : `${origin}/${page}`;

  let title = 'rankvault';
  let desc = 'Private file hosting. Large drops are warned, never refused.';
  let color = '#0A84FF';

  if (page === 'handoff' && id) {
    const row = await sbGet(`handoffs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const share = row?.share_id ? await sbGet(`public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=name,size,mime&limit=1`) : null;
    const who = row?.recipient || row?.title || 'someone';
    title = row ? `handoff for ${who}` : 'handoff';
    desc = row
      ? `${share?.name || 'a file'}${share?.size ? ` · ${prettySize(share.size)}` : ''}. ${row.note || 'a named delivery from this machine.'}`
      : 'a named file delivery.';
    color = row?.accent || color;
  } else if (page === 'proof' && id) {
    const row = await sbGet(`proofs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    title = row ? `proof · ${row.file_name}` : 'proof';
    desc = row ? `sha-256 ${row.sha256.slice(0, 16)}… · ${prettySize(row.size)}. ${row.note || 'a local checksum, filed if you asked.'}` : 'a checksum slip.';
  } else if (page === 'quiet' && id) {
    const row = await sbGet(`quiet_slips?id=eq.${encodeURIComponent(id)}&select=author,reads,max_reads&limit=1`);
    title = 'a quiet slip';
    desc = row
      ? `${row.author || 'unsigned'} · opens ${row.max_reads} time${row.max_reads === 1 ? '' : 's'}. the note stays off the card.`
      : 'a short note that burns after it is read.';
    color = '#BF5AF2';
  } else if (page === 'handoff') {
    title = 'handoff';
    desc = 'Send a local file to a named person. Bytes land in the share table. Discord unfurls the link.';
  } else if (page === 'proof') {
    title = 'proof';
    desc = 'Hash a local file in the tab and file the checksum. No size cap — only a warning if it may feel slow.';
  } else if (page === 'quiet') {
    title = 'quiet';
    desc = 'A short note that burns after it is read. Discord gets a card, not the text.';
  }

  if (!isBot(ua) && embedFlag !== '1') {
    res.status(302).setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(pageHtml({ title, desc, url: dest, color }));
}
