import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { shareUrls, type CloudMeta } from '../lib/cloudShare';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function ShelfPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${SB_URL}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,file_url,created_at,download_count,lock_pass,expires_at&order=created_at.desc&limit=40`,
          {
            headers: {
              apikey: SB_KEY,
              Authorization: `Bearer ${SB_KEY}`,
            },
          },
        );
        if (!res.ok) throw new Error('shelf fetch failed');
        const data = await res.json();
        if (cancelled) return;
        const now = Date.now();
        const mapped: CloudMeta[] = (Array.isArray(data) ? data : [])
          .filter((r: any) => !r.expires_at || +new Date(r.expires_at) > now)
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            type: r.mime || 'file',
            size: Number(r.size) || 0,
            url: r.file_url,
            lockPass: r.lock_pass || '',
            createdAt: r.created_at,
            downloads: Number(r.download_count) || 0,
          }));
        setRows(mapped);
      } catch {
        if (!cancelled) setErr('could not load the public shelf. the db might be napping.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">shelf</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public drops, recently published.</h1>
          <p className="text-sm text-neutral-500 mb-6">not a vault. just what people flipped public. locked ones still need a pass on the share page.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by name"
            className="w-full mb-6 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}
          <div className="space-y-2">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate('share', r.id)}
                className="w-full text-left glass rounded-2xl px-5 py-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{r.name}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatBytes(r.size)} · {r.type}
                      {r.lockPass ? ' · locked' : ''}
                    </p>
                  </div>
                  <span className="text-[11px] text-neutral-500 shrink-0">{shareUrls(r.id).embed.replace(/^https?:\/\//, '')}</span>
                </div>
              </button>
            ))}
            {!err && !filtered.length && <p className="text-sm text-neutral-500">nothing on the shelf yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
