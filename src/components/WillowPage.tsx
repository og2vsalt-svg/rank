import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Entry = { id: string; name: string; note: string; size: number; at: number };

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function WillowPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState('');

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem('rank_willow') || '[]'));
    } catch {
      setEntries([]);
    }
  }, []);

  const persist = (next: Entry[]) => {
    setEntries(next);
    localStorage.setItem('rank_willow', JSON.stringify(next));
  };

  const addFile = (file: File) => {
    if (file.size > 40 * 1024 * 1024) setWarn('large file. this desk only logs metadata so it stays snappy.');
    else setWarn('');
    persist([
      { id: Date.now().toString(36), name: file.name, note: note || 'dropped into willow', size: file.size, at: Date.now() },
      ...entries,
    ]);
    setName('');
    setNote('');
  };

  const addManual = () => {
    if (!name.trim()) return;
    persist([{ id: Date.now().toString(36), name: name.trim(), note: note.trim() || 'logged by hand', size: 0, at: Date.now() }, ...entries]);
    setName('');
    setNote('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">willow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet journal of drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a local ledger of what you sent out so you remember the names.</p>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="file name" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={addManual} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">log</button>
          </div>
          <label className="block rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30 transition-colors mb-6">
            drop a file here to log it. no hard cap, just a slowness warning on big ones.
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); }} />
          </label>
          {warn && <p className="text-xs text-amber-400/80 mb-4">{warn}</p>}
          <div className="space-y-2">
            {entries.length === 0 && <p className="text-sm text-neutral-600">nothing logged yet.</p>}
            {entries.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm text-white">{e.name}</p>
                  <p className="text-xs text-neutral-500">{e.note} · {e.size ? formatBytes(e.size) : 'no size'} · {new Date(e.at).toLocaleString()}</p>
                </div>
                <button onClick={() => persist(entries.filter((x) => x.id !== e.id))} className="text-xs text-neutral-500 hover:text-white">forget</button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
