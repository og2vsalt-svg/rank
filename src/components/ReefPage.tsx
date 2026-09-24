import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Link = { id: string; label: string; href: string };

const KEY = 'rankvault-reef-v1';

export default function ReefPage() {
  const [title, setTitle] = useState('your reef');
  const [bio, setBio] = useState('quiet links. no noise.');
  const [links, setLinks] = useState<Link[]>([]);
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.bio) setBio(parsed.bio);
      if (Array.isArray(parsed.links)) setLinks(parsed.links);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ title, bio, links }));
  }, [title, bio, links]);

  const add = () => {
    if (!label.trim() || !href.trim()) return;
    const url = href.startsWith('http') ? href : `https://${href}`;
    setLinks((prev) => [...prev, { id: Date.now().toString(36), label: label.trim(), href: url }]);
    setLabel('');
    setHref('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">reef</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a tiny public card.</h1>
          <p className="text-sm text-neutral-500 mb-6">not a vault. just a shelf of links that lives in this browser.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent text-2xl font-semibold outline-none mb-2" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full bg-white/5 rounded-2xl p-3 text-sm text-neutral-300 outline-none border border-white/10 mb-6" />
          <div className="space-y-2 mb-6">
            {links.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <a href={l.href} target="_blank" rel="noreferrer" className="flex-1 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/8 text-sm transition-colors">{l.label}</a>
                <button onClick={() => setLinks((p) => p.filter((x) => x.id !== l.id))} className="text-xs text-neutral-500 px-2">remove</button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="https://" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">add</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
