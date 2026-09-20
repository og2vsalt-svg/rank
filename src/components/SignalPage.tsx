import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function SignalPage() {
  const [name, setName] = useState('quiet drop');
  const [line, setLine] = useState('a file waiting on rankvault');
  const preview = useMemo(() => {
    const title = name.trim() || 'rankvault';
    const desc = line.trim() || 'quiet file hosting';
    return { title, desc };
  }, [name, line]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">signal</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">embed preview</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">see how a discord unfurl wants to look. real /s links already ship og tags from the api.</p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <textarea
              value={line}
              onChange={(e) => setLine(e.target.value)}
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31]"
          >
            <div className="h-1 bg-[#0a84ff]" />
            <div className="p-4">
              <p className="text-[11px] text-[#00a8fc] mb-1">rankvault</p>
              <p className="text-sm font-semibold text-[#00a8fc]">{preview.title}</p>
              <p className="text-sm text-[#dbdee1] mt-1">{preview.desc}</p>
              <div className="mt-3 h-28 rounded-xl bg-gradient-to-br from-[#0a84ff]/40 to-[#af52de]/30" />
            </div>
          </motion.div>
          <p className="text-xs text-neutral-600 mt-3">paste a live /s/id in discord and the server embed route fills title + size for you.</p>
        </div>
      </main>
    </div>
  );
}
