import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function MossPage() {
  const [raw, setRaw] = useState(() => localStorage.getItem('rank-moss-ids') || '');
  const [draft, setDraft] = useState('');

  const ids = useMemo(() => raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean), [raw]);

  const add = () => {
    const next = [...ids, draft.trim()].filter(Boolean);
    const uniq = Array.from(new Set(next));
    const joined = uniq.join('\n');
    setRaw(joined);
    localStorage.setItem('rank-moss-ids', joined);
    setDraft('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">moss</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet list of share ids.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. just the ids you want to keep handy, each with a discord embed url.</p>
          <div className="flex gap-2 mb-6">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="paste a share id" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">pin</button>
          </div>
          <ul className="space-y-2">
            {ids.length === 0 && <li className="text-sm text-neutral-500">nothing pinned yet</li>}
            {ids.map((id) => {
              const urls = shareUrls(id);
              return (
                <li key={id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-sm text-white mb-1">{id}</p>
                  <p className="text-xs text-neutral-500 break-all">{urls.embed}</p>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
