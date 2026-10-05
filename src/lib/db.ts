const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

export const db = { url: SUPABASE_URL, key: SUPABASE_KEY };

function headers(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra,
  };
}

export async function listShares(limit = 24) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/public_shares?select=id,name,mime,size,file_url,author,caption,created_at,download_count&is_public=eq.true&order=created_at.desc&limit=${limit}`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error('could not load shares');
  return res.json();
}

export async function getShare(id: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: headers() },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export function publicObjectUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/shares/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export async function uploadShare(file: File, caption: string, author: string) {
  const id = Math.random().toString(36).slice(2, 10);
  const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'file';
  const path = `${id}-${safe}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/shares/${path}`, {
    method: 'POST',
    headers: headers({
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true',
    }),
    body: file,
  });
  if (!up.ok) {
    const detail = await up.text();
    throw new Error(detail || 'upload failed');
  }
  const file_url = publicObjectUrl(path);
  const row = {
    id,
    name: file.name,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    file_url,
    author: author || null,
    caption: caption || null,
    is_public: true,
    meta: { source: 'shelf' },
  };
  const saved = await fetch(`${SUPABASE_URL}/rest/v1/public_shares`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify(row),
  });
  if (!saved.ok) {
    const detail = await saved.text();
    throw new Error(detail || 'saved the file, but the share row failed');
  }
  const rows = await saved.json();
  return rows[0] || row;
}

export async function saveReceipt(input: { shareId?: string; name: string; note: string; author: string; size: number; mime?: string }) {
  const id = Math.random().toString(36).slice(2, 10);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/receipts`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify({
      id,
      share_id: input.shareId || null,
      name: input.name,
      mime: input.mime || null,
      size: input.size || 0,
      note: input.note || null,
      author: input.author || null,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const rows = await res.json();
  return rows[0];
}

export async function getReceipt(id: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/receipts?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: headers() },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export async function saveSatchel(input: {
  shareId: string;
  title: string;
  note: string;
  author: string;
  steps: { id: string; label: string; done: boolean }[];
  fileName: string;
  fileUrl: string;
  mime: string;
  size: number;
}) {
  const id = Math.random().toString(36).slice(2, 10);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/satchels`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify({
      id,
      share_id: input.shareId,
      title: input.title,
      note: input.note || null,
      author: input.author || null,
      steps: input.steps,
      file_name: input.fileName,
      file_url: input.fileUrl,
      mime: input.mime || null,
      size: input.size || 0,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const rows = await res.json();
  return rows[0];
}

export async function getSatchel(id: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/satchels?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: headers() },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export async function toggleSatchelStep(id: string, steps: { id: string; label: string; done: boolean }[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/satchels?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify({ steps }),
  });
  if (!res.ok) throw new Error(await res.text());
  const rows = await res.json();
  return rows[0] || null;
}

export function prettySize(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
