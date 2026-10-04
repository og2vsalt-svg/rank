import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Hoist = { id: string; lift: string; berth: string; note: string | null; share_id: string | null; file_name: string | null; size: number; created_at?: string };
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export default function DavitsPage() {
  const { shareId } = useRouter();
  const [lift, setLift] = useState('');
  const [berth, setBerth] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Hoist | null>(null);
  const [recent, setRecent] = useState<Hoist[]>([]);
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

  const loadRecent = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/davits?select=id,lift,berth,note,share_id,file_name,size,created_at&order=created_at.desc&limit=8`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };
  const loadOne = async (id: string) => {
    const res = await fetch(`${SB_URL}/rest/v1/davits?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]) { setRow(rows[0]); return; }
    }
    const share = await fetch(`/api/share?id=${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => null);
    if (share && share.id) {
      setRow({ id: share.id, lift: share.meta?.lift || share.name, berth: share.meta?.berth || '', note: share.caption || share.meta?.note || null, share_id: share.id, file_name: share.name, size: Number(share.size) || 0 });
    }
  };
  useEffect(() => { loadRecent(); if (shareId) loadOne(shareId); }, [shareId]);

  const send = async () => {
    if (!lift.trim() || !file) return;
    setBusy(true); setError(''); setWarn('');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', note.trim() || lift.trim());
      body.append('author', berth.trim() || 'davits');
      body.append('cardTitle', lift.trim().slice(0, 120));
      const res = await fetch('/api/share', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `share ${res.status}`);
      if (data.warn) setWarn(data.warn);
      const id = data.id || uid();
      await fetch('/api/share', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, caption: note.trim() || lift.trim(), cardTitle: lift.trim(), meta: { lift: lift.trim(), berth: berth.trim(), note: note.trim(), desk: 'davits' } }) }).catch(() => null);
      const next = { id, lift: lift.trim().slice(0, 120), berth: berth.trim().slice(0, 160), note: note.trim().slice(0, 280) || null, share_id: id, file_name: file.name, size: file.size };
      await fetch(`${SB_URL}/rest/v1/davits`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(next) }).catch(() => null);
      setRow({ ...next, created_at: new Date().toISOString() });
      setLift(''); setBerth(''); setNote(''); setFile(null);
      loadRecent();
      history.pushState(null, '', `/davits/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'the hoist did not take');
    } finally { setBusy(false); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/davits/${row.id}` : '';
  const slow = !!file && file.size > 12 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">davits</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">hoist a file off the dock.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">name the lift, say where it lands, and send a local file into the share table. the slip sits beside it. paste /davits in Discord. older desks stay where they are.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-6 sm:p-8">
          <input value={lift} onChange={(e) => setLift(e.target.value)} placeholder="what you are lifting" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <input value={berth} onChange={(e) => setBerth(e.target.value)} placeholder="berth it lands on" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="how it should be set down" maxLength={280} rows={3} className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50 resize-none" />
          <label className="mt-3 block text-xs text-neutral-500">local file<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" /></label>
          {file && <p className="mt-2 text-xs text-neutral-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
          {slow && <p className="mt-3 text-xs text-amber-200/90">large drop. preview may feel slow. it still goes through.</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!lift.trim() || !file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'hoisting…' : 'hoist it'}</motion.button>
        </motion.div>
        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.lift}</p>
            {row.berth && <p className="text-sm text-[#64d2ff] mt-1">{row.berth}</p>}
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
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">recent hoists</p>
            <div className="grid gap-2">{recent.map((item) => (
              <a key={item.id} href={`/davits/${item.id}`} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition duration-200">
                <p className="text-white text-sm">{item.lift}</p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.berth || item.file_name}</p>
              </a>
            ))}</div>
          </div>
        )}
      </main>
    </div>
  );
}
