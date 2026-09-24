import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Thorn = { id: string; title: string; url: string; tag: string };

export default function BramblePage() {
  const [items, setItems] = useState<Thorn[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tag, setTag] = useState('later');

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem('rank_bramble') || '[]'));
    } catch {
      setItems([]);
    }
  }, []);

  const persist = (next: Thorn[]) => {
    setItems(next);
    localStorage.setItem('rank_bramble', JSON.stringify(next));
  };

  const add = () => {
    if (!title.trim() || !url.trim()) return;
    persist([{ id: Date.now().toString(36), title: title.trim(), url: url.trim(), tag: tag.trim() || 'later' }, ...items]);
    setTitle('');
    setUrl('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">bramble</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a tangle of links.</h1>
          <p className="text-neutral-400 text-sm mb-6">local bookmark thicket. no cloud, no vault grid. just urls you want later.</p>
          <div className="grid gap-2 mb-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="label" className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="tag" className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          </div>
          <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium mb-8">tuck it in</button>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                <div className="min-w-0">
                  <a href={it.url} target="_blank" rel="noreferrer" className="text-sm text-white hover:text-[#0a84ff] truncate block">{it.title}</a>
                  <p className="text-[11px] text-neutral-500">{it.tag}</p>
                </div>
                <button onClick={() => persist(items.filter((x) => x.id !== it.id))} className="text-xs text-neutral-500 hover:text-white">drop</button>
              </div>
            ))}
            {!items.length && <p className="text-sm text-neutral-600">empty thicket.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
