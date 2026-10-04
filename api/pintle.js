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

export default async function handler(req, res) {
  const id = String(req.query.id || '').trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const dest = id ? `${proto}://${host}/pintle/${encodeURIComponent(id)}` : `${proto}://${host}/pintle`;
  let title = 'pintle — rankvault';
  let desc = 'a hinge on a filed file. large files are warned, never refused.';
  let image = 'https://og2vsalt-svg.github.io/rank/og.png';
  if (id) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/pintles?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      const rows = r.ok ? await r.json() : [];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) {
        title = `${row.purpose} — pintle`;
        desc = `opens toward ${row.opens_toward}${row.note ? ' · ' + row.note : ''}${row.file_name ? ' · ' + row.file_name : ''}`;
        if (row.share_id) {
          const shareRes = await fetch(`${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=mime,file_url&limit=1`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          });
          const shares = shareRes.ok ? await shareRes.json() : [];
          const share = Array.isArray(shares) ? shares[0] : null;
          if (share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '')) image = share.file_url;
        }
      }
    } catch {}
  }
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#0A84FF" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(image)}" /><meta property="og:image:secure_url" content="${esc(image)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(dest)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(image)}" /></head><body style="margin:0;background:#f5f5f7;color:#1d1d1f;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.08em;text-transform:uppercase;font-size:13px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#6e6e73">${esc(desc)}</p></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
}
