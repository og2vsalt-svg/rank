import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Fall = { id: string; call: string; deck: string | null; note: string | null; share_id: string | null; file_name: string | null; size: number; created_at?: string };

export default function CatfallPage() {
  const { shareId } = useRouter();
  const [call, setCall] = useState('');
  const [deck, setDeck] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Fall | null>(null);
  const [recent, setRecent] = useState<Fall[]>([]);
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

  const loadRecent = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/catfalls?select=id,call,deck,note,share_id,file_name,size,created_at&order=created_at.desc&limit=8`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };
  const loadOne = async (id: string) => {
    const res = await fetch(`${SB_URL}/rest/v1/catfalls?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setRow(rows[0]);
  };
  useEffect(() => { loadRecent(); if (shareId) loadOne(shareId); }, [shareId]);

  const send = async () => {
    if (!call.trim() || !file) return;
    setBusy(true); setError(''); setWarn('');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', note.trim() || call.trim());
      body.append('author', deck.trim() || 'catfall');
      body.append('cardTitle', call.trim().slice(0, 120));
      const res = await fetch('/api/share', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `share ${res.status}`);
      if (data.warn) setWarn(data.warn);
      const id = data.id;
      await fetch('/api/share', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, caption: note.trim() || call.trim(), cardTitle: call.trim(), meta: { desk: 'catfall', call: call.trim(), deck: deck.trim() } }),
      }).catch(() => null);
      const next = { id, call: call.trim().slice(0, 160), deck: deck.trim().slice(0, 160) || null, note: note.trim().slice(0, 280) || null, share_id: id, file_name: file.name, size: file.size };
      const saved = await fetch(`${SB_URL}/rest/v1/catfalls`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(next) });
      if (!saved.ok) throw new Error('the share landed, but the catfall row did not');
      setRow({ ...next, created_at: new Date().toISOString() });
      setCall(''); setDeck(''); setNote(''); setFile(null);
      loadRecent();
      history.pushState(null, '', `/catfall/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'the fall did not take');
    } finally { setBusy(false); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/catfall/${row.id}` : '';
  const slow = !!file && file.size > 12 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">catfall</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">lower a file to a name.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">this is a catch, not the vault. the local file goes into the share table. the call lives beside it. paste /catfall in Discord. older desks stay where they are.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-6 sm:p-8">
          <input value={call} onChange={(e) => setCall(e.target.value)} placeholder="who should catch it" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <input value={deck} onChange={(e) => setDeck(e.target.value)} placeholder="which deck" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="how it should land" maxLength={280} rows={3} className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50 resize-none" />
          <label className="mt-3 block text-xs text-neutral-500">local file<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" /></label>
          {file && <p className="mt-2 text-xs text-neutral-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
          {slow && <p className="mt-3 text-xs text-amber-200/90">large drop. preview may feel slow. it still goes through.</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!call.trim() || !file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'lowering…' : 'lower it'}</motion.button>
        </motion.div>
        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.call}</p>
            {row.deck && <p className="text-sm text-[#64d2ff] mt-1">{row.deck}</p>}
            {row.file_name && <p className="text-xs text-neutral-500 mt-1">{row.file_name}</p>}
            {row.note && <p className="text-sm text-neutral-300 mt-2">{row.note}</p>}
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              {row.share_id && <a href={`/s/${row.share_id}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">open file card</a>}
            </div>
          </motion.div>
        )}
        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">recent lowerings</p>
            <div className="grid gap-2">{recent.map((item) => (
              <a key={item.id} href={`/catfall/${item.id}`} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition duration-200">
                <p className="text-white text-sm">{item.call}</p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.deck || item.file_name}</p>
              </a>
            ))}</div>
          </div>
        )}
      </main>
    </div>
  );
}
