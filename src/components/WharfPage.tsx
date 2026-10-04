import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Berth = { id: string; berth: string; collector: string; tide: string | null; share_id: string | null; file_name: string | null; size: number; created_at?: string };

export default function WharfPage() {
  const { shareId } = useRouter();
  const [berth, setBerth] = useState('');
  const [collector, setCollector] = useState('');
  const [tide, setTide] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Berth | null>(null);
  const [recent, setRecent] = useState<Berth[]>([]);
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

  const loadRecent = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/wharves?select=id,berth,collector,tide,share_id,file_name,size,created_at&order=created_at.desc&limit=8`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };
  const loadOne = async (id: string) => {
    const res = await fetch(`${SB_URL}/rest/v1/wharves?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]) { setRow(rows[0]); return; }
    }
    const share = await fetch(`/api/share?id=${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => null);
    if (share?.id) setRow({ id: share.id, berth: share.meta?.berth || share.name, collector: share.meta?.collector || share.author || '', tide: share.meta?.tide || share.caption || null, share_id: share.id, file_name: share.name, size: Number(share.size) || 0 });
  };
  useEffect(() => { loadRecent(); if (shareId) loadOne(shareId); }, [shareId]);

  const send = async () => {
    if (!berth.trim() || !file) return;
    setBusy(true); setError(''); setWarn('');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', tide.trim() || berth.trim());
      body.append('author', collector.trim() || 'wharf');
      body.append('cardTitle', berth.trim().slice(0, 120));
      const res = await fetch('/api/share', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `share ${res.status}`);
      if (data.warn) setWarn(data.warn);
      const id = data.id;
      await fetch('/api/share', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, caption: tide.trim() || berth.trim(), cardTitle: berth.trim(), meta: { desk: 'wharf', berth: berth.trim(), collector: collector.trim(), tide: tide.trim() } }) });
      const next = { id, berth: berth.trim().slice(0, 120), collector: collector.trim().slice(0, 120), tide: tide.trim().slice(0, 180) || null, share_id: id, file_name: file.name, size: file.size };
      await fetch(`${SB_URL}/rest/v1/wharves`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(next) }).catch(() => null);
      setRow({ ...next, created_at: new Date().toISOString() });
      setBerth(''); setCollector(''); setTide(''); setFile(null);
      loadRecent();
      history.pushState(null, '', `/wharf/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'the berth did not take');
    } finally { setBusy(false); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/wharf/${row.id}` : '';
  const slow = !!file && file.size > 12 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">wharf</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">set a file on the tide.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">name the berth, say who collects it, and send a local file into the share table. the tide is a note, not a lock. paste /wharf in Discord. older desks stay put.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass rounded-3xl p-6 sm:p-8">
          <input value={berth} onChange={(e) => setBerth(e.target.value)} placeholder="berth name" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <input value={collector} onChange={(e) => setCollector(e.target.value)} placeholder="who collects it" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <input value={tide} onChange={(e) => setTide(e.target.value)} placeholder="tide note, like thursday morning" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <label className="mt-3 block text-xs text-neutral-500">local file<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" /></label>
          {file && <p className="mt-2 text-xs text-neutral-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
          {slow && <p className="mt-3 text-xs text-amber-200/90">large drop. preview may feel slow. it still goes through.</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!berth.trim() || !file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'setting it down…' : 'set it on the wharf'}</motion.button>
        </motion.div>
        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.berth}</p>
            {row.collector && <p className="text-sm text-[#64d2ff] mt-1">for {row.collector}</p>}
            {row.tide && <p className="text-sm text-neutral-300 mt-2">{row.tide}</p>}
            {row.file_name && <p className="text-xs text-neutral-500 mt-1">{row.file_name}</p>}
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              {row.share_id && <a href={`/s/${row.share_id}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">open file card</a>}
            </div>
          </motion.div>
        )}
        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">recent berths</p>
            <div className="grid gap-2">{recent.map((item) => (
              <a key={item.id} href={`/wharf/${item.id}`} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition duration-200">
                <p className="text-white text-sm">{item.berth}</p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.collector || item.file_name}</p>
              </a>
            ))}</div>
          </div>
        )}
      </main>
    </div>
  );
}
