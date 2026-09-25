import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

type Log = { id: string; note: string; at: string };

const KEY = 'rankvault-hinterland';

export default function HinterlandPage() {
  const [id, setId] = useState('');
  const [note, setNote] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLogs(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Log[]) => {
    setLogs(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const add = () => {
    const clean = id.trim().replace(/^.*[/=]/, '');
    if (!clean) return;
    persist([{ id: clean, note: note.trim(), at: new Date().toISOString() }, ...logs].slice(0, 80));
    setId('');
    setNote('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">hinterland</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a trip log of public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. paste share ids you already published. they stay in this browser with a note and a discord /s link.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id or /s/url" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-3" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional note" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-4" />
          <button onClick={add} disabled={!id.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition">pin drop</button>
          <ul className="mt-8 space-y-3">
            {logs.map((row) => {
              const urls = shareUrls(row.id);
              return (
                <li key={row.id + row.at} className="rounded-2xl bg-black/25 border border-white/8 px-4 py-3">
                  <p className="text-sm text-white">{row.note || row.id}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{new Date(row.at).toLocaleString()}</p>
                  <a href={urls.embed} className="text-xs text-[#0a84ff] break-all mt-1 inline-block">{urls.embed}</a>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
