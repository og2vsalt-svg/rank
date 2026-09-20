import { head } from '@vercel/blob';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isBot(ua) {
  const u = (ua || '').toLowerCase();
  return /discord|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|skype|linkedinbot|embed|preview|bot|crawler|spider/.test(u);
}

function page({ title, desc, image, url, type }) {
  const img = image || 'https://og2vsalt-svg.github.io/rank/og.png';
  const t = type && type.startsWith('image/') ? 'website' : 'website';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta name="theme-color" content="#0a84ff" />
<meta property="og:type" content="${t}" />
<meta property="og:site_name" content="rankvault" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(img)}" />
<meta property="og:url" content="${esc(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(img)}" />
<meta http-equiv="refresh" content="0;url=${esc(url)}" />
</head>
<body style="background:#050506;color:#f5f5f7;font-family:Inter,system-ui,sans-serif">
<p>opening drop… <a href="${esc(url)}">continue</a></p>
</body>
</html>`;
}

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const appUrl = `${proto}://${host}/#share?f=${encodeURIComponent(id)}`;

  if (!id) {
    res.status(302).setHeader('Location', '/');
    res.end();
    return;
  }

  let meta = null;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const listed = await head(`meta/${id}.json`, { token: process.env.BLOB_READ_WRITE_TOKEN });
      const r = await fetch(listed.url);
      if (r.ok) meta = await r.json();
    } catch {}
  }

  const title = meta ? `${meta.name} — rankvault` : 'rankvault drop';
  const desc = meta
    ? `${meta.type || 'file'} · ${Math.round((meta.size || 0) / 1024)} kb · quiet public drop`
    : 'a quiet file drop. open to download.';
  const image = meta && String(meta.type || '').startsWith('image/') ? meta.url : undefined;

  if (!isBot(req.headers['user-agent']) && req.query.embed !== '1') {
    res.status(302).setHeader('Location', appUrl);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(page({ title, desc, image, url: appUrl, type: meta?.type }));
}
