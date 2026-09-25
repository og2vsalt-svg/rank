import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Slip = { id: string; title: string; body: string; ts: number };

const KEY = 'rankvault.nook.slips';

export default function NookPage() {
  const [slips, setSlips] = useState<Slip[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(slips));
  }, [slips]);

  const add = () => {
    if (!title.trim() && !body.trim()) return;
    setSlips((s) => [{ id: Date.now().toString(36), title: title.trim() || 'untitled slip', body, ts: Date.now() }, ...s]);
    setTitle('');
    setBody('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nook</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a private slip pile.</h1>
          <p className="text-neutral-400 text-sm mb-6">tiny notes that live only on this device. not a vault file. just scraps you do not want to share yet.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full mb-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="write something quiet" className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y" />
          <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">keep slip</button>
          <div className="mt-8 space-y-3">
            {slips.length === 0 && <p className="text-xs text-neutral-500">empty nook.</p>}
            {slips.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white font-medium">{s.title}</p>
                    <p className="text-[11px] text-neutral-500 mb-2">{new Date(s.ts).toLocaleString()}</p>
                    <p className="text-sm text-neutral-400 whitespace-pre-wrap">{s.body}</p>
                  </div>
                  <button onClick={() => setSlips((x) => x.filter((y) => y.id !== s.id))} className="text-xs text-neutral-500 hover:text-white">toss</button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
