import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type LinkItem = { id: string; url: string; title: string; at: number };

const KEY = 'rank.links.v1';

export default function LinksPage() {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {}
  }, []);

  const persist = (next: LinkItem[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!url.trim()) return;
    persist([{ id: Date.now().toString(36), url: url.trim(), title: title.trim() || url.trim(), at: Date.now() }, ...items]);
    setUrl('');
    setTitle('');
  };

  return (
    <div className="min-h-screen mesh">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">locker</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">link locker</h1>
          <p className="text-neutral-500 text-sm mb-8">stash urls next to the vault. local only.</p>
          <div className="glass rounded-3xl p-5 flex flex-col gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="label" className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={add} className="self-start px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save</button>
          </div>
          <ul className="mt-8 space-y-2">
            {items.map((it) => (
              <li key={it.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{it.title}</p>
                  <a href={it.url} target="_blank" rel="noreferrer" className="text-xs text-[#0a84ff] truncate block">{it.url}</a>
                </div>
                <button onClick={() => persist(items.filter((x) => x.id !== it.id))} className="text-xs text-neutral-500">remove</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </main>
    </div>
  );
}
