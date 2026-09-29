import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const KEY = 'rankvault-folio';

export default function FolioPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setTitle(parsed.title || '');
      setBody(parsed.body || '');
    } catch {}
  }, []);

  const persist = (nextTitle: string, nextBody: string) => {
    setTitle(nextTitle);
    setBody(nextBody);
    try {
      localStorage.setItem(KEY, JSON.stringify({ title: nextTitle, body: nextBody }));
    } catch {}
  };

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 sm:p-10"
        >
          <p className="text-[#0a84ff] text-sm mb-2">folio</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a reading room that stays on this device.</h1>
          <p className="text-neutral-400 text-sm mb-8">
            not a vault. write a title and a page. nothing leaves the tab unless you copy it.
          </p>
          <input
            value={title}
            onChange={(e) => persist(e.target.value, body)}
            placeholder="untitled folio"
            className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-neutral-600 mb-5"
          />
          <textarea
            value={body}
            onChange={(e) => persist(title, e.target.value)}
            rows={16}
            placeholder="start a page…"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm leading-relaxed text-neutral-200 outline-none focus:border-[#0a84ff]/50 transition"
          />
          <p className="text-xs text-neutral-500 mt-3">{words} words · {body.length} chars · local only</p>
        </motion.div>
      </div>
    </div>
  );
}
