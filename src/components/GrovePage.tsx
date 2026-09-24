import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Bundle = { id: string; name: string; files: string[]; created: number };

const KEY = 'rankvault-grove';

function load(): Bundle[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function save(rows: Bundle[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export default function GrovePage() {
  const [rows, setRows] = useState<Bundle[]>(() => load());
  const [name, setName] = useState('');
  const [ids, setIds] = useState('');

  const add = () => {
    const list = ids
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim() || !list.length) return;
    const next = [{ id: Date.now().toString(36), name: name.trim(), files: list, created: Date.now() }, ...rows];
    setRows(next);
    save(next);
    setName('');
    setIds('');
  };

  const remove = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    save(next);
  };

  const count = useMemo(() => rows.reduce((n, r) => n + r.files.length, 0), [rows]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">grove</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">cluster share ids into little stands.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. just named clumps of public ids you want to keep together. lives in this browser.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="stand name" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-3" />
          <textarea value={ids} onChange={(e) => setIds(e.target.value)} placeholder="paste share ids, one per line" className="w-full h-28 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-4 resize-none" />
          <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">plant stand</button>
          <p className="text-xs text-neutral-500 mt-4">{rows.length} stands · {count} ids</p>
          <div className="mt-6 space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-medium">{r.name}</p>
                    <p className="text-xs text-neutral-500 mt-1">{r.files.length} ids</p>
                  </div>
                  <button onClick={() => remove(r.id)} className="text-xs text-neutral-500 hover:text-white">clear</button>
                </div>
                <p className="text-[11px] text-neutral-500 mt-2 break-all">{r.files.join(' · ')}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
