import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Item = { id: string; text: string; at: number };
const KEY = 'rankvault-stash';

export default function StashPage() {
  const [items, setItems] = useState<Item[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setItems((xs) => [{ id: Date.now().toString(36), text: t, at: Date.now() }, ...xs].slice(0, 80));
    setDraft('');
  };

  const grabClip = async () => {
    try {
      const t = await navigator.clipboard.readText();
      add(t);
    } catch {
      add(draft);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">stash</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">park clipboard crumbs.</h1>
          <p className="text-neutral-400 text-sm mb-6">a local pile of snippets. not files, not the vault.</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none mb-3"
            placeholder="paste something you dont want to lose"
          />
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => add(draft)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">save</button>
            <button onClick={grabClip} className="px-4 py-2 rounded-full glass text-sm">read clipboard</button>
          </div>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="rounded-2xl bg-white/5 border border-white/8 p-3 flex items-start justify-between gap-3">
                <p className="text-sm text-neutral-200 whitespace-pre-wrap break-all">{it.text}</p>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => navigator.clipboard.writeText(it.text)} className="text-[11px] text-neutral-400 hover:text-white">copy</button>
                  <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))} className="text-[11px] text-neutral-500 hover:text-red-400">drop</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-neutral-500">empty stash.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
