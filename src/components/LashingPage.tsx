import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Knot = { id: string; knot: string; mate: string; note: string | null; share_id: string | null; file_name: string | null; size: number };

export default function LashingPage() {
  const { shareId } = useRouter();
  const [knot, setKnot] = useState('');
  const [mate, setMate] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Knot | null>(null);
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

  const loadOne = async (id: string) => {
    const res = await fetch(`${SB_URL}/rest/v1/lashings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]) { setRow(rows[0]); return; }
    }
    const share = await fetch(`/api/share?id=${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => null);
    if (share?.id) setRow({ id: share.id, knot: share.meta?.knot || share.name, mate: share.meta?.mate || '', note: share.caption || null, share_id: share.id, file_name: share.name, size: Number(share.size) || 0 });
  };
  useEffect(() => { if (shareId) loadOne(shareId); }, [shareId]);

  const send = async () => {
    if (!knot.trim() || !mate.trim() || !file) return;
    setBusy(true); setError(''); setWarn('');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', note.trim() || `lashed to ${mate.trim()}`);
      body.append('author', 'lashing');
      body.append('cardTitle', knot.trim().slice(0, 120));
      const res = await fetch('/api/share', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `share ${res.status}`);
      if (data.warn) setWarn(data.warn);
      const id = data.id;
      await fetch('/api/share', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, caption: note.trim() || `lashed to ${mate.trim()}`, cardTitle: knot.trim(), meta: { desk: 'lashing', knot: knot.trim(), mate: mate.trim(), note: note.trim() } }) });
      const next = { id, knot: knot.trim().slice(0, 120), mate: mate.trim().slice(0, 80), note: note.trim().slice(0, 280) || null, share_id: id, file_name: file.name, size: file.size };
      await fetch(`${SB_URL}/rest/v1/lashings`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(next) }).catch(() => null);
      setRow(next);
      setKnot(''); setMate(''); setNote(''); setFile(null);
      history.pushState(null, '', `/lashing/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'the knot did not take');
    } finally { setBusy(false); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/lashing/${row.id}` : '';
  const slow = !!file && file.size > 12 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#ff9f0a] text-sm font-medium mb-2 tracking-wide">lashing</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">tie a new file to an old one.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">paste the share id already on the table, name the knot, and send a second local file. both live in the database. this is not another drawer. paste /lashing in Discord.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass rounded-3xl p-6 sm:p-8">
          <input value={knot} onChange={(e) => setKnot(e.target.value)} placeholder="knot name" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#ff9f0a]/50" />
          <input value={mate} onChange={(e) => setMate(e.target.value)} placeholder="existing share id" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#ff9f0a]/50" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="why these two belong together" maxLength={280} rows={3} className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#ff9f0a]/50 resize-none" />
          <label className="mt-3 block text-xs text-neutral-500">local file to lash on<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" /></label>
          {file && <p className="mt-2 text-xs text-neutral-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
          {slow && <p className="mt-3 text-xs text-amber-200/90">large drop. preview may feel slow. it still goes through.</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!knot.trim() || !mate.trim() || !file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'lashing…' : 'lash it'}</motion.button>
        </motion.div>
        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.knot}</p>
            <p className="text-sm text-[#ff9f0a] mt-1">tied to {row.mate}</p>
            {row.note && <p className="text-sm text-neutral-300 mt-2">{row.note}</p>}
            {row.file_name && <p className="text-xs text-neutral-500 mt-1">{row.file_name}</p>}
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              {row.share_id && <a href={`/s/${row.share_id}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">open file card</a>}
              {row.mate && <a href={`/s/${row.mate}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">open the mate</a>}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
