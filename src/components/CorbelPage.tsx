import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type LinkRow = { id: string; url: string; note: string | null; author: string | null; created_at: string };

export default function CorbelPage() {
  const [url, setUrl] = useState('https://');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      const clean = url.trim();
      if (!/^https?:\/\//i.test(clean)) throw new Error('needs a full http(s) address');
      const res = await fetch(`${SB_URL}/rest/v1/links`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ url: clean, note: note.trim() || null, author: 'corbel' }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNote('');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'could not seat that link');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-7">
          <p className="text-[#0a84ff] text-sm font-medium mb-2">corbel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a shelf for addresses</h1>
          <p className="text-neutral-400 text-sm mb-5">saves a link and a short note into the links table. no files, no cap.</p>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none mb-3" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is here" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none mb-4" />
          {err && <p className="text-xs text-red-400 mb-3 break-all">{err}</p>}
          <button onClick={save} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'seating…' : 'seat the link'}</button>
          <ul className="mt-6 space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <a href={r.url} className="text-sm text-[#7cb4ff] break-all" target="_blank" rel="noreferrer">{r.url}</a>
                {r.note && <p className="text-xs text-neutral-500 mt-1">{r.note}</p>}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
