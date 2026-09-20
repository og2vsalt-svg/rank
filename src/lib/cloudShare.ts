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
};

export async function publishShare(payload: {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  lockPass?: string;
  expiresAt?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'upload failed' };
    return { ok: true, id: data.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'network error' };
  }
}

export async function fetchShare(id: string): Promise<CloudMeta | null> {
  try {
    const res = await fetch(`/api/share?id=${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
