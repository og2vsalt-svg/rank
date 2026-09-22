import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

const KEY = 'rankvault-annex';

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export default function AnnexPage() {
  const { files } = useVault();
  const [notes, setNotes] = useState<Record<string, string>>(load);
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return files.filter((f) => !needle || f.name.toLowerCase().includes(needle) || (notes[f.id] || '').toLowerCase().includes(needle));
  }, [files, q, notes]);

  const setNote = (id: string, value: string) => {
    const next = { ...notes, [id]: value };
    setNotes(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">annex</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">side notes on files.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the file itself. a quiet margin you can scribble in. stays on this device.</p>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter files or notes"
            className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />

          {rows.length === 0 ? (
            <p className="text-sm text-neutral-500">vault is empty. drop something first.</p>
          ) : (
            <ul className="space-y-3">
              {rows.slice(0, 30).map((f) => (
                <li key={f.id} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <p className="text-sm text-white truncate mb-2">{f.name}</p>
                  <textarea
                    value={notes[f.id] || ''}
                    onChange={(e) => setNote(f.id, e.target.value)}
                    rows={2}
                    placeholder="why this file exists…"
                    className="w-full resize-none rounded-2xl bg-black/30 border border-white/5 px-3 py-2 text-sm outline-none text-neutral-300"
                  />
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
