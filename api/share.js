import { put, head } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: 'blob store not configured. add BLOB_READ_WRITE_TOKEN on vercel.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const id = (req.query.id || '').toString().trim();
      if (!id) {
        res.status(400).json({ error: 'missing id' });
        return;
      }

      const metaPath = `meta/${id}.json`;
      const metaUrl = `https://blob.vercel-storage.com/${metaPath}`;

      // try head + fetch of public meta blob
      let meta;
      try {
        const listed = await head(metaPath, { token: process.env.BLOB_READ_WRITE_TOKEN });
        const r = await fetch(listed.url);
        if (!r.ok) throw new Error('meta missing');
        meta = await r.json();
      } catch {
        res.status(404).json({ error: 'share not found' });
        return;
      }

      if (meta.expiresAt && +new Date(meta.expiresAt) < Date.now()) {
        res.status(410).json({ error: 'share expired' });
        return;
      }

      res.status(200).json(meta);
      return;
    }

    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        res.status(400).json({ error: 'send json { id?, name, type, size, dataUrl, lockPass?, expiresAt? }' });
        return;
      }

      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf8'));
      const id = (body.id || uid()).toString();
      const name = (body.name || 'file').toString();
      const type = (body.type || 'application/octet-stream').toString();
      const dataUrl = body.dataUrl;
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        res.status(400).json({ error: 'dataUrl required' });
        return;
      }

      // decode data url
      const comma = dataUrl.indexOf(',');
      const b64 = dataUrl.slice(comma + 1);
      const buf = Buffer.from(b64, 'base64');

      if (buf.length > 90 * 1024 * 1024) {
        res.status(413).json({ error: 'file too large for this share path (soft ~90mb). still no hard product cap, but blob post has a practical limit.' });
        return;
      }

      const fileBlob = await put(`shares/${id}/${name}`, buf, {
        access: 'public',
        contentType: type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      const meta = {
        id,
        name,
        type,
        size: body.size || buf.length,
        url: fileBlob.url,
        lockPass: body.lockPass || '',
        expiresAt: body.expiresAt || null,
        createdAt: new Date().toISOString(),
        downloads: 0,
      };

      await put(`meta/${id}.json`, JSON.stringify(meta), {
        access: 'public',
        contentType: 'application/json',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      res.status(200).json({ ok: true, id, url: fileBlob.url, sharePath: `/#share?f=${id}` });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'share failed' });
  }
}
