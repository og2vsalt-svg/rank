import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function QuillPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hint, setHint] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rank_quill');
      if (raw) {
        const j = JSON.parse(raw);
        setTitle(j.title || '');
        setBody(j.body || '');
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('rank_quill', JSON.stringify({ title, body }));
  }, [title, body]);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  const download = () => {
    const blob = new Blob([`# ${title || 'untitled'}\n\n${body}`], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (title || 'letter') + '.md';
    a.click();
    setHint('saved as a markdown file on this device. no hard cap, huge drafts can just feel sluggish.');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">quill</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a letter desk.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault. just a quiet place to write something and keep it on this machine.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none mb-4 placeholder:text-neutral-700"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="start writing"
            className="w-full min-h-[280px] bg-white/[0.03] rounded-2xl p-4 outline-none text-sm resize-none placeholder:text-neutral-600 leading-relaxed"
          />
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">{words} words</p>
            <button onClick={download} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium transition-transform active:scale-[0.98]">
              export .md
            </button>
          </div>
          {hint && <p className="text-xs text-neutral-500 mt-4">{hint}</p>}
        </motion.div>
      </div>
    </div>
  );
}
