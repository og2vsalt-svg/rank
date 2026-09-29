import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Slip = { id: string; text: string; at: number };

const KEY = 'rank.drift.v1';

function load(): Slip[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DriftPage() {
  const [slips, setSlips] = useState<Slip[]>(load);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(slips.slice(0, 40)));
    } catch {}
  }, [slips]);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setSlips((prev) => [{ id: Date.now().toString(36), text, at: Date.now() }, ...prev].slice(0, 40));
    setDraft('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">drift</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a local slip of copied lines.</h1>
          <p className="text-neutral-400 text-sm mb-6">stash short notes in this browser. not uploaded. not the vault.</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full bg-white/5 rounded-2xl px-4 py-3 text-white outline-none resize-none mb-3"
            placeholder="paste something you do not want to lose yet"
          />
          <button onClick={add} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">keep</button>
          <ul className="mt-8 space-y-3">
            {slips.map((s) => (
              <li key={s.id} className="rounded-2xl bg-white/[0.04] p-4">
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">{s.text}</p>
                <button className="text-xs text-[#0a84ff] mt-2" onClick={() => navigator.clipboard.writeText(s.text).catch(() => {})}>
                  copy
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
