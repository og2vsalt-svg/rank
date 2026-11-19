export default async function handler(req, res) {
  // Fallback for bot crawlers when specific card/gate fails
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rank-six-iota.vercel.app';
  const url = `${proto}://${host}${req.url || '/'}`;
  const title = 'rankvault — private file hosting';
  const desc = 'Drop local files. Soft size warnings only. Polished Discord embeds on every link. Apple-style springs on frosted glass.';
  const image = 'https://og2vsalt-svg.github.io/rank/og.png';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:image" content="${image}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary_large_image"></head><body style="background:#050506;color:#f5f5f7;font-family:system-ui;padding:4rem;text-align:center"><h1>${title}</h1><p>${desc}</p></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300');
  res.status(200).send(html);
}
