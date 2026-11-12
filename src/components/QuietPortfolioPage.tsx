import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietPortfolioPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<{ file: File; caption: string; preview?: string }[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(36).then(setShares).catch(() => {});
  }, []);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (arr.some(f => f.size > 40 * 1024 * 1024)) {
      setWarn('large files detected. the browser may feel slow while uploading. no hard limit.');
    } else {
      setWarn(null);
    }
    const withPreviews = arr.map(f => {
      const item: { file: File; caption: string; preview?: string } = { file: f, caption: '' };
      if (f.type.startsWith('image/')) {
        item.preview = URL.createObjectURL(f);
      }
      return item;
    });
    setFiles(prev => [...prev, ...withPreviews]);
    setStatus('idle');
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    const out = [];
    for (const item of files) {
      const res = await publishLocalFile(item.file, {
        caption: item.caption || sharedCaption || 'portfolio',
        color: '#0A84FF',
        cardTitle: item.file.name,
        author: 'rankvault',
        meta: { desk: 'quietportfolio' },
      });
      if (res.ok && res.id) {
        out.push({
          id: res.id,
          name: item.file.name,
          embed: shareUrls(res.id).embed,
          warn: res.warn || null,
        });
      }
    }
    setResults(out);
    setFiles([]);
    setStatus('done');
    listPublicShares(36).then(setShares).catch(() => {});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-16 px-5 max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet portfolio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06 }}
          className="text-neutral-400 mb-8 max-w-2xl"
        >
          A refined portfolio grid for local files. Live previews settle into spring-animated frosted glass. Shared or per-file captions. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple motion.
        </motion.p>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div>
            <h2 className="text-sm font-medium text-neutral-300 mb-4">recent public shares</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AnimatePresence>
                {shares.slice(0, 12).map((item, i) => (
                  <motion.a
                    key={item.id}
                    href={shareUrls(item.id).app}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 140, damping: 18 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="glass rounded-[24px] p-4 block hover:bg-white/[0.05] transition"
                  >
                    {item.type?.startsWith('image/') && item.fileUrl && (
                      <img src={item.fileUrl} alt="" className="w-full h-32 object-cover rounded-2xl mb-3" />
                    )}
                    <p className="text-sm font-medium truncate">{item.name || 'untitled'}</p>
                    <p className="text-xs text-neutral-500 mt-1">{(item.size / 1024).toFixed(0)} KB</p>
                    {item.caption && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{item.caption}</p>}
                  </motion.a>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="glass rounded-[28px] p-6 h-fit sticky top-28">
            <div
              className="border border-dashed border-white/20 rounded-2xl p-6 text-center cursor-pointer mb-4 hover:border-white/40 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
              }}
            >
              <input type="file" multiple onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="port-file" />
              <label htmlFor="port-file" className="cursor-pointer block text-sm text-neutral-400">
                drop files for the portfolio
              </label>
            </div>
            {warn && <p className="text-amber-400 text-xs mb-3">{warn}</p>}
            <input
              value={sharedCaption}
              onChange={(e) => setSharedCaption(e.target.value)}
              placeholder="shared caption (optional)"
              className="w-full glass rounded-2xl px-4 py-2.5 text-sm outline-none mb-4"
            />
            {files.length > 0 && (
              <div className="space-y-3 mb-4 max-h-64 overflow-auto">
                {files.map((item, i) => (
                  <div key={i} className="text-xs">
                    {item.preview && <img src={item.preview} alt="" className="w-full h-16 object-cover rounded-xl mb-1" />}
                    <p className="truncate text-neutral-300">{item.file.name}</p>
                    <input
                      value={item.caption}
                      onChange={(e) => {
                        const next = [...files];
                        next[i].caption = e.target.value;
                        setFiles(next);
                      }}
                      placeholder="caption"
                      className="w-full bg-white/5 rounded-lg px-2 py-1 mt-1 text-xs outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={shareAll}
              disabled={!files.length || status === 'uploading'}
              className="w-full py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50"
            >
              {status === 'uploading' ? 'publishing…' : 'publish portfolio'}
            </motion.button>
            {results.length > 0 && (
              <div className="mt-4 space-y-2">
                {results.map(r => (
                  <div key={r.id} className="text-xs">
                    <p className="truncate">{r.name}</p>
                    <button onClick={() => navigator.clipboard.writeText(r.embed)} className="text-[#0A84FF]">copy link</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
