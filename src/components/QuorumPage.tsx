import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Opt = { id: string; label: string; votes: number };

export default function QuorumPage() {
  const [question, setQuestion] = useState('which drop should we keep public?');
  const [draft, setDraft] = useState('');
  const [opts, setOpts] = useState<Opt[]>([
    { id: 'a', label: 'keep foyer quiet', votes: 0 },
    { id: 'b', label: 'pin the latest share', votes: 0 },
  ]);

  const total = useMemo(() => opts.reduce((n, o) => n + o.votes, 0), [opts]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quorum</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a tiny vote on this device.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a file vault. just a soft poll you can run while people are in the room.</p>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none mb-4" />
          <div className="flex gap-2 mb-6">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="add option" className="flex-1 bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" />
            <button
              onClick={() => {
                if (!draft.trim()) return;
                setOpts((o) => [...o, { id: Date.now().toString(36), label: draft.trim(), votes: 0 }]);
                setDraft('');
              }}
              className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium"
            >
              add
            </button>
          </div>
          <div className="space-y-3">
            {opts.map((o) => {
              const pct = total ? Math.round((o.votes / total) * 100) : 0;
              return (
                <button
                  key={o.id}
                  onClick={() => setOpts((list) => list.map((x) => (x.id === o.id ? { ...x, votes: x.votes + 1 } : x)))}
                  className="w-full text-left rounded-2xl bg-white/[0.04] p-4 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex justify-between text-sm text-white mb-2">
                    <span>{o.label}</span>
                    <span className="text-neutral-500">{o.votes}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div className="h-full bg-[#0a84ff]" initial={false} animate={{ width: pct + '%' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
