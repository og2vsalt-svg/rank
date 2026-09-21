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

async function publishToSupabase(payload: {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  lockPass?: string;
  expiresAt?: string | null;
  author?: string;
}): Promise<{ ok: boolean; id?: string; url?: string; error?: string; warn?: string }> {
  if (!payload.dataUrl || !payload.dataUrl.startsWith('data:')) {
    return { ok: false, error: 'missing file data' };
  }
  const approx = Math.floor(((payload.dataUrl.split(',')[1] || '').length * 3) / 4);
  const warn =
    approx > 8 * 1024 * 1024 || payload.size > 8 * 1024 * 1024
      ? 'big drop. the tab or host may feel slow. no hard cap on our side.'
      : undefined;

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
    meta: { source: 'rankvault-client', warn },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(`${SB_URL}/rest/v1/public_shares`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text || `supabase ${res.status}`, warn };
  }
  return { ok: true, id: payload.id, url: payload.dataUrl, warn };
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
    const data = await res.json().catch(() => ({}));
    // fall through to supabase instead of hard-blocking on size
    if (data.error && payload.size < 2 * 1024 * 1024) {
      return { ok: false, error: data.error };
    }
  } catch {
    // no api (static host) — fall through
  }

  try {
    return await publishToSupabase(payload);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'network error' };
  }
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

export function shareUrls(id: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  return {
    app: `${origin}${path}#share?f=${encodeURIComponent(id)}`,
    embed: `${origin}/s/${id}`,
  };
}
