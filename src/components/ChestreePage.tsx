import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
type Partner = { id: string; mast: string; partner: string | null; note: string | null; share_id: string | null; file_name: string | null; created_at: string };

export default function ChestreePage() {
  const { shareId } = useRouter();
  const [mast, setMast] = useState('');
  const [partner, setPartner] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Partner | null>(null);
  const [recent, setRecent] = useState<Partner[]>([]);

  const loadRecent = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/chestrees?select=id,mast,partner,note,share_id,file_name,created_at&order=created_at.desc&limit=8`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };
  const loadOne = async (id: string) => {
    const res = await fetch(`${SB_URL}/rest/v1/chestrees?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setRow(rows[0]);
  };
  useEffect(() => { loadRecent(); if (shareId) loadOne(shareId); }, [shareId]);

  const send = async () => {
    if (!mast.trim()) return;
    setBusy(true); setError(''); setWarn('');
    try {
      let shareIdOut: string | null = null;
      if (file) {
        const body = new FormData();
        body.append('file', file, file.name);
        body.append('caption', note.trim() || mast.trim());
        if (partner.trim()) body.append('author', partner.trim());
        const res = await fetch('/api/share', { method: 'POST', body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `share ${res.status}`);
        shareIdOut = data.id;
        if (data.warn) setWarn(data.warn);
      }
      const id = uid();
      const next = { id, mast: mast.trim().slice(0, 80), partner: partner.trim().slice(0, 80) || null, note: note.trim().slice(0, 280) || null, share_id: shareIdOut, file_name: file?.name || null };
      const ins = await fetch(`${SB_URL}/rest/v1/chestrees`, { method: 'POST', headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(next) });
      if (!ins.ok) throw new Error(`chestree ${ins.status}: ${(await ins.text()).slice(0, 160)}`);
      const saved = await ins.json();
      setRow(Array.isArray(saved) ? saved[0] : { ...next, created_at: new Date().toISOString() });
      setMast(''); setNote(''); setFile(null);
      loadRecent();
      history.pushState(null, '', `/chestree/${id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'could not seat the partner'); }
    finally { setBusy(false); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/chestree/${row.id}` : '';
  const slow = !!file && file.size > 12 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#bf5af2] text-sm font-medium mb-2 tracking-wide">chestree</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">seat the mast, keep the partner.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">a mast name, who partners it, and an optional local file. the file lands in the share table. the partner lives in chestrees. paste /chestree in Discord. older desks stay where they are.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-6 sm:p-8">
          <input value={mast} onChange={(e) => setMast(e.target.value)} placeholder="mast" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#bf5af2]/50" />
          <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="partner, optional" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#bf5af2]/50" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="how it sits in the partners" maxLength={280} rows={3} className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#bf5af2]/50 resize-none" />
          <label className="mt-3 block text-xs text-neutral-500">local file, optional<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" /></label>
          {slow && <p className="mt-3 text-xs text-amber-200/90">large drop. preview may feel slow. it still goes through.</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!mast.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'seating…' : 'seat the partner'}</motion.button>
        </motion.div>
        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.mast}</p>
            <p className="text-sm text-neutral-400 mt-1">{row.partner || 'no partner'}{row.file_name ? ` · ${row.file_name}` : ''}</p>
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
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">partners</p>
            <div className="grid gap-2">{recent.map((item) => (
              <a key={item.id} href={`/chestree/${item.id}`} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition duration-200">
                <p className="text-white text-sm">{item.mast}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{item.partner || 'unpartnered'}</p>
              </a>
            ))}</div>
          </div>
        )}
      </main>
    </div>
  );
}
