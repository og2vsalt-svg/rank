import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
type Forward = { id: string; port: string; eta_note: string | null; note: string | null; share_id: string | null; file_name: string | null; mime: string | null; size: number; author: string | null; created_at: string };

export default function BowspritPage() {
  const { shareId } = useRouter();
  const [port, setPort] = useState('');
  const [eta, setEta] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Forward | null>(null);
  const [recent, setRecent] = useState<Forward[]>([]);

  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  const loadRecent = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/bowsprits?select=id,port,eta_note,note,share_id,file_name,mime,size,author,created_at&order=created_at.desc&limit=8`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };
  const loadOne = async (id: string) => {
    const res = await fetch(`${SB_URL}/rest/v1/bowsprits?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setRow(rows[0]);
  };
  useEffect(() => { loadRecent(); if (shareId) loadOne(shareId); }, [shareId]);

  const send = async () => {
    if (!port.trim() || !file) return;
    setBusy(true); setError(''); setWarn('');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', note.trim() || `for ${port.trim()}`);
      body.append('author', author.trim() || 'bowsprit');
      body.append('cardTitle', port.trim());
      const res = await fetch('/api/share', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `share ${res.status}`);
      if (data.warn) setWarn(data.warn);
      const id = uid();
      const next = {
        id,
        port: port.trim().slice(0, 140),
        eta_note: eta.trim().slice(0, 120) || null,
        note: note.trim().slice(0, 280) || null,
        share_id: data.id,
        file_name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        author: author.trim().slice(0, 80) || null,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/bowsprits`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(next),
      });
      if (!ins.ok) throw new Error(`bowsprit ${ins.status}: ${(await ins.text()).slice(0, 180)}`);
      const saved = await ins.json();
      setRow(Array.isArray(saved) ? saved[0] : { ...next, created_at: new Date().toISOString() });
      setPort(''); setEta(''); setNote(''); setFile(null);
      loadRecent();
      history.pushState(null, '', `/bowsprit/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not run the spar out');
    } finally {
      setBusy(false);
    }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/bowsprit/${row.id}` : '';
  const slow = !!file && file.size > 12 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">bowsprit</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">run a file forward.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">name the port, write when it should arrive, and drop a local file. the bytes go into the share table. the spar is only the forward. paste /bowsprit in Discord. older desks stay put. nothing is refused for size — a large drop is only warned.</p>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <label className="block text-sm text-neutral-300 mb-2">port</label>
            <input value={port} onChange={(e) => setPort(e.target.value)} placeholder="falmouth desk" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0A84FF] transition" />
            <label className="block text-sm text-neutral-300 mt-4 mb-2">when it should land</label>
            <input value={eta} onChange={(e) => setEta(e.target.value)} placeholder="thursday morning, not a lock" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0A84FF] transition" />
            <label className="block text-sm text-neutral-300 mt-4 mb-2">handling note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0A84FF] transition" />
            <label className="block text-sm text-neutral-300 mt-4 mb-2">signed by</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0A84FF] transition" />
            <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-4 cursor-pointer hover:border-[#0A84FF]/60 transition">
              <span className="text-sm text-neutral-300">{file ? file.name : 'choose a local file'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-3 text-sm text-amber-300">large drop. the page may feel slow while it uploads. it is not refused.</p>}
            {warn && <p className="mt-2 text-sm text-amber-300">{warn}</p>}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <button onClick={send} disabled={busy || !port.trim() || !file} className="mt-5 rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 transition active:scale-[0.98]">
              {busy ? 'running out…' : 'run the spar out'}
            </button>
          </div>
          {row && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-white font-medium">{row.port}</p>
              <p className="text-sm text-neutral-400 mt-1">{row.file_name} · {row.eta_note || 'no arrival note'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => copy(card)} className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">copy /bowsprit card</button>
                {row.share_id && <button onClick={() => copy(`${location.origin}/s/${row.share_id}`)} className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">copy file card</button>}
              </div>
            </motion.div>
          )}
          <div className="mt-8 space-y-2">
            {recent.map((item) => (
              <button key={item.id} onClick={() => { setRow(item); history.pushState(null, '', `/bowsprit/${item.id}`); }} className="w-full text-left rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.05] transition">
                <span className="text-white">{item.port}</span>
                <span className="block text-xs text-neutral-500">{item.file_name || 'file'}{item.eta_note ? ` · ${item.eta_note}` : ''}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
