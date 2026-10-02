/** public shares — reads/writes supabase public_shares; optional /api/share for blob uploads */

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');

const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

export type CloudMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  lockPass?: string;
  expiresAt?: string | null;
  createdAt?: string;
  downloads?: number;
  author?: string | null;
};

export type ShareOpts = {
  caption?: string;
  author?: string;
  lockPass?: string;
  expiresAt?: string | null;
  color?: string;
  cardTitle?: string;
};

function sbHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
}

function rowToMeta(row: any): CloudMeta {
  return {
    id: row.id,
    name: row.name,
    type: row.mime || row.type || 'application/octet-stream',
    size: Number(row.size) || 0,
    url: row.file_url || row.url,
    lockPass: row.lock_pass || row.lockPass || '',
    expiresAt: row.expires_at || row.expiresAt || null,
    createdAt: row.created_at || row.createdAt,
    downloads: Number(row.download_count ?? row.downloads ?? 0),
    author: row.author || null,
  };
}

async function fetchShareFromSupabase(id: string): Promise<CloudMeta | null> {
  const res = await fetch(
    `${SB_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: sbHeaders() },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
  if (!row || row.is_public === false) return null;
  if (row.expires_at && +new Date(row.expires_at) < Date.now()) return null;
  return rowToMeta(row);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function shareUrls(id: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const enc = encodeURIComponent(id);
  return {
    app: `${origin}${path}#share?f=${enc}`,
    embed: `${origin}/s/${id}`,
    card: `${origin}/s/${id}`,
    file: `${origin}/f/${id}`,
    open: `${origin}/open/${id}`,
    go: `${origin}/go/${id}`,
    link: `${origin}/link/${id}`,
  };
}

async function publishViaApi(file: File, opts: ShareOpts, id: string) {
  const body = new FormData();
  body.set('file', file, file.name || 'file');
  body.set('id', id);
  if (opts.caption) body.set('caption', opts.caption);
  if (opts.author) body.set('author', opts.author);
  if (opts.lockPass) body.set('lockPass', opts.lockPass);
  if (opts.expiresAt) body.set('expiresAt', opts.expiresAt);
  if (opts.color) body.set('color', opts.color);
  if (opts.cardTitle) body.set('cardTitle', opts.cardTitle);
  const res = await fetch('/api/share', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, error: data.error || `share api ${res.status}` };
  return { ok: true as const, id: data.id || id, url: data.url, embed: `${location.origin}${data.embedPath || `/s/${id}`}`, warn: data.warn || null };
}

export async function publishLocalFile(
  file: File,
  opts: ShareOpts = {},
): Promise<{ ok: boolean; id?: string; url?: string; embed?: string; warn?: string | null; error?: string }> {
  const id = uid();
  const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'file';
  const path = `${id}/${safeName}`;
  const warn = file.size > 40 * 1024 * 1024 ? 'large drop. the browser may feel slow while it sends.' : null;
  try {
    const up = await fetch(`${SB_URL}/storage/v1/object/shares/${path}`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
        'cache-control': 'public, max-age=31536000',
      },
      body: file,
    });
    if (!up.ok) {
      const viaApi = await publishViaApi(file, opts, id).catch(() => null);
      if (viaApi?.ok) return { ...viaApi, warn: viaApi.warn || warn };
      const text = await up.text().catch(() => '');
      return { ok: false, error: viaApi?.error || `storage ${up.status}: ${text.slice(0, 180)}` };
    }
    const fileUrl = `${SB_URL}/storage/v1/object/public/shares/${path}`;
    const row = {
      id,
      name: opts.cardTitle || file.name || safeName,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      file_url: fileUrl,
      lock_pass: opts.lockPass || null,
      expires_at: opts.expiresAt || null,
      is_public: true,
      download_count: 0,
      author: opts.author || null,
      caption: opts.caption || null,
      meta: { warn, source: 'rankvault', caption: opts.caption || null, color: opts.color || null, cardTitle: opts.cardTitle || null },
    };
    const ins = await fetch(`${SB_URL}/rest/v1/public_shares?on_conflict=id`, {
      method: 'POST',
      headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(row),
    });
    if (!ins.ok) {
      const text = await ins.text();
      return { ok: false, error: `shares table ${ins.status}: ${text.slice(0, 180)}` };
    }
    return { ok: true, id, url: fileUrl, embed: `${location.origin}/s/${id}`, warn };
  } catch (e: any) {
    try {
      const viaApi = await publishViaApi(file, opts, id);
      if (viaApi.ok) return { ...viaApi, warn: viaApi.warn || warn };
      return { ok: false, error: viaApi.error || e?.message || 'upload failed' };
    } catch {
      return { ok: false, error: e?.message || 'upload failed' };
    }
  }
}

export async function publishShare(payload: {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  lockPass?: string;
  expiresAt?: string | null;
  author?: string;
  caption?: string;
}): Promise<{ ok: boolean; id?: string; url?: string; error?: string; warn?: string }> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, id: data.id || payload.id, url: data.url, warn: data.warn };
    }
  } catch {
    // no api (static host) — fall through
  }
  if (!payload.dataUrl || !payload.dataUrl.startsWith('data:')) return { ok: false, error: 'missing file data' };
  const approx = Math.floor(((payload.dataUrl.split(',')[1] || '').length * 3) / 4);
  const warn = approx > 8 * 1024 * 1024 || payload.size > 8 * 1024 * 1024 ? 'big drop. the tab or host may feel slow. no hard cap on our side.' : undefined;
  const row = {
    id: payload.id,
    name: payload.name,
    mime: payload.type || 'application/octet-stream',
    size: payload.size || approx,
    file_url: payload.dataUrl,
    lock_pass: payload.lockPass || null,
    expires_at: payload.expiresAt || null,
    is_public: true,
    download_count: 0,
    author: payload.author || null,
    caption: payload.caption || null,
    meta: { source: 'rankvault-client', warn, caption: payload.caption || null },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const res = await fetch(`${SB_URL}/rest/v1/public_shares`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) return { ok: false, error: (await res.text()) || `supabase ${res.status}`, warn };
  return { ok: true, id: payload.id, url: payload.dataUrl, warn };
}

export async function fetchShare(id: string): Promise<CloudMeta | null> {
  try {
    const res = await fetch(`/api/share?id=${encodeURIComponent(id)}`);
    if (res.ok) return await res.json();
  } catch {
    // fall through
  }
  try {
    return await fetchShareFromSupabase(id);
  } catch {
    return null;
  }
}

export async function listPublicShares(limit = 24): Promise<CloudMeta[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,file_url,expires_at,created_at,download_count,author,lock_pass&order=created_at.desc&limit=${limit}`,
      { headers: sbHeaders() },
    );
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row: any) => !row.expires_at || +new Date(row.expires_at) > Date.now())
      .map(rowToMeta);
  } catch {
    return [];
  }
}
