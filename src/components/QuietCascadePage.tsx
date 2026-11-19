import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietCascadePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState('');

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...list]);
    setCaptions((prev) => [...prev, ...list.map(() => '')]);
  }, []);

  const publishAll = async () => {
    if (!files.length) return;
    setPublishing(true);
    setWarn('');
    const newLinks: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = captions[i] || '';
      const res = await publishLocalFile(file, { caption });
      if (res.ok && res.id) {
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id);
        newLinks.push(urls.embed);
      }
    }
    setLinks(newLinks);
    setFiles([]);
    setCaptions([]);
    setPublishing(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[36px] p-10 text-center"
        >
          <p className="text-[#0a84ff] text-xs tracking-widest uppercase mb-3">quiet cascade</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-4">let them fall.</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-md mx-auto">
            Drop local files. They cascade into the database with individual quiet captions. Every link carries a polished Discord embed. Soft size warnings only — no hard limits.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/10 rounded-3xl p-12 mb-6 hover:border-white/20 transition-all"
          >
            <p className="text-neutral-500">drop files here</p>
            <input
              type="file"
              multiple
              className="hidden"
              id="cascade-input"
              onChange={(e) => {
                const list = Array.from(e.target.files || []);
                setFiles((prev) => [...prev, ...list]);
                setCaptions((prev) => [...prev, ...list.map(() => '')]);
              }}
            />
            <label htmlFor="cascade-input" className="mt-4 inline-block text-[#0a84ff] text-sm cursor-pointer">
              or choose
            </label>
          </div>

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 mb-3 text-left"
              >
                <span className="text-sm text-white truncate flex-1">{f.name}</span>
                <input
                  type="text"
                  placeholder="quiet caption"
                  value={captions[i] || ''}
                  onChange={(e) => {
                    const next = [...captions];
                    next[i] = e.target.value;
                    setCaptions(next);
                  }}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-sm text-white flex-1"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}

          {files.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={publishAll}
              disabled={publishing}
              className="mt-6 px-8 py-3 bg-white text-black rounded-full font-medium disabled:opacity-50"
            >
              {publishing ? 'cascading…' : 'publish cascade'}
            </motion.button>
          )}

          {links.length > 0 && (
            <div className="mt-8 text-left">
              <p className="text-sm text-neutral-400 mb-2">share links (Discord-ready):</p>
              {links.map((l, i) => (
                <p key={i} className="text-xs text-[#0a84ff] break-all mb-1">{l}</p>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
