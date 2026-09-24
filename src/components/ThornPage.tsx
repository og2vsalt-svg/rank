import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Pin = { id: string; text: string; at: string };

export default function ThornPage() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rb_thorn');
      if (raw) setPins(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('rb_thorn', JSON.stringify(pins)); } catch {}
  }, [pins]);

  const add = () => {
    const clean = text.trim();
    if (!clean) return;
    setPins((prev) => [{ id: Date.now().toString(36), text: clean, at: new Date().toISOString() }, ...prev]);
    setText('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">thorn</p>
          <h1 className="text-3xl font-semibold mb-3">sticky pins. no files.</h1>
          <p className="text-neutral-400 text-sm mb-6">tiny local notes that never leave this browser.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full bg-white/5 rounded-2xl p-4 text-sm outline-none" placeholder="leave a thorn…" />
          <button onClick={add} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">pin it</button>
          <div className="mt-6 space-y-2">
            {pins.map((p) => (
              <div key={p.id} className="rounded-2xl bg-white/5 px-4 py-3 flex justify-between gap-3">
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">{p.text}</p>
                <button onClick={() => setPins((prev) => prev.filter((x) => x.id !== p.id))} className="text-xs text-neutral-500">drop</button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
