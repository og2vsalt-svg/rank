import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

const KEY = 'rankvault-quill-notes';

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export default function QuillPage() {
  const { files } = useVault() as any;
  const [notes, setNotes] = useState<Record<string, string>>(load);
  const [active, setActive] = useState<string | null>(null);
  const list = files || [];
  const huge = list.some((f: any) => (f.size || 0) > 40 * 1024 * 1024);

  const save = (id: string, text: string) => {
    const next = { ...notes, [id]: text };
    setNotes(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const current = active ? list.find((f: any) => f.id === active) : null;

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
          <p className="text-[#0a84ff] text-sm mb-2">quill</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">margin notes on a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">scribble why you kept a file. stays on this device. not a vault, just ink next to it.</p>
          {huge && <p className="text-xs text-amber-300/80 mb-4">big files in the pile. notes are light, opening previews might lag.</p>}
          {list.length === 0 && <p className="text-sm text-neutral-500">nothing to annotate yet.</p>}
          <ul className="space-y-2 mb-5">
            {list.slice(0, 30).map((f: any) => (
              <li key={f.id}>
                <button
                  onClick={() => setActive(f.id)}
                  className={`w-full text-left rounded-2xl px-4 py-3 border ${active === f.id ? 'border-[#0a84ff]/40 bg-[#0a84ff]/10' : 'border-white/5 bg-white/[0.03]'}`}
                >
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{notes[f.id] ? notes[f.id].slice(0, 80) : 'no note'}</p>
                </button>
              </li>
            ))}
          </ul>
          {current && (
            <textarea
              value={notes[current.id] || ''}
              onChange={(e) => save(current.id, e.target.value)}
              placeholder="why this file exists…"
              className="w-full min-h-[140px] rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
