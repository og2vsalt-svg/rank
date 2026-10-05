import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Slip = { id: string; file_name: string; size: number; sha256: string; note: string | null; share_id: string | null; author: string | null };

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
async function sha256(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function loadSlip(id: string): Promise<Slip | null> {
  const res = await fetch(`${SB_URL}/rest/v1/jackstays?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export default function JackstayPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [hashing, setHashing] = useState(false);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [alsoFile, setAlsoFile] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [slip, setSlip] = useState<Slip | null>(null);

  useEffect(() => { if (shareId) loadSlip(shareId).then(setSlip).catch(() => setSlip(null)); }, [shareId]);
  const slow = useMemo(() => (file && file.size > 40 * 1024 * 1024 ? 'large file. hashing and sending may feel slow. nothing is refused for size.' : ''), [file]);

  const onPick = async (next: File | null) => {
    setFile(next); setHash(''); setErr(''); setLink('');
    if (!next) return;
    setHashing(true);
    try { setHash(await sha256(next)); } catch { setErr('this browser could not hash the file.'); } finally { setHashing(false); }
  };

  const keep = async () => {
    if (!file || !hash) return;
    setBusy(true); setErr('');
    const id = uid();
    let shareIdOut: string | null = null;
    if (alsoFile) {
      const filed = await publishLocalFile(file, { author: author.trim() || 'jackstay', caption: note.trim() || `proof ${hash.slice(0, 12)}`, cardTitle: file.name, color: '#30D158' });
      if (!filed.ok || !filed.id) { setBusy(false); setErr(filed.error || 'the bytes did not land. uncheck file-the-bytes to keep only the proof.'); return; }
      shareIdOut = filed.id;
    }
    const ins = await fetch(`${SB_URL}/rest/v1/jackstays`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ id, file_name: file.name.slice(0, 240), size: file.size, sha256: hash, note: note.trim() || null, share_id: shareIdOut, author: author.trim() || null }),
    });
    setBusy(false);
    if (!ins.ok) { setErr((await ins.text()).slice(0, 180) || 'proof table did not take the slip'); return; }
    setSlip((await ins.json())[0]);
    const url = `${location.origin}/jackstay/${id}`;
    setLink(url);
    history.pushState(null, '', `/jackstay/${id}`);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] tracking-[0.22em] uppercase text-neutral-500 mb-3">proof slip</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight text-white mb-3">jackstay</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }} className="text-neutral-400 leading-relaxed mb-8 max-w-xl">hash a file on this machine, then keep the slip. the bytes can ride along into the share table, or stay local. Discord gets a card either way.</motion.p>
        {slip && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-6 mb-6">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">{slip.author || 'unsigned'}</p>
            <h2 className="text-2xl font-semibold text-white tracking-tight">{slip.file_name}</h2>
            <p className="text-neutral-400 text-sm mt-2">{pretty(Number(slip.size))}</p>
            {slip.note && <p className="text-neutral-300 mt-3 leading-relaxed">{slip.note}</p>}
            <p className="mt-4 font-mono text-[12px] text-neutral-300 break-all bg-black/30 rounded-2xl px-4 py-3">{slip.sha256}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {link && <button onClick={() => navigator.clipboard.writeText(link)} className="text-neutral-300 hover:text-white">copy proof link</button>}
              {slip.share_id && <a className="text-[#64d2ff] hover:text-white" href={`/s/${slip.share_id}`}>open the filed copy</a>}
            </div>
          </motion.section>
        )}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-[28px] p-6">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" className="hidden" onChange={(e) => onPick(e.target.files?.[0] || null)} />
            <span className="text-white text-sm font-medium">{file ? file.name : 'choose a local file'}</span>
            <span className="block text-neutral-500 text-xs mt-1">{hashing ? 'hashing…' : file ? pretty(file.size) : 'the hash stays even if you do not file the bytes.'}</span>
          </label>
          {hash && <p className="mt-3 font-mono text-[11px] text-neutral-400 break-all">{hash}</p>}
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name on the slip" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this proves" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={alsoFile} onChange={(e) => setAlsoFile(e.target.checked)} /> also file the bytes in the share table</label>
          {slow && <p className="text-amber-200/80 text-xs mt-3">{slow}</p>}
          {err && <p className="text-red-300 text-xs mt-3">{err}</p>}
          <button disabled={!file || !hash || busy || hashing} onClick={keep} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition active:scale-[0.98]">{busy ? 'keeping…' : 'keep the slip'}</button>
        </motion.div>
      </main>
    </div>
  );
}
