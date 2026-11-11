import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function LumenArchivePage() {
  const { addFiles } = useVault();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(36).then(setShares).finally(() => setLoading(false));
  }, []);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    setStatus('idle');
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    try {
      await addFiles(files, 'archive');
      for (const file of files) {
        await publishLocalFile(file, {
          caption: caption || undefined,
          color,
          cardTitle: file.name,
          author: 'rankvault',
        });
      }
      const fresh = await listPublicShares(36);
      setShares(fresh);
      setFiles([]);
      setCaption('');
      setStatus('done');
    } catch {
      setStatus('idle');
    }
  };

  const filtered = shares.filter(s => filter === 'all' || (s.type || '').startsWith(filter));
  const large = files.some(f => f.size > 40 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          lumen archive
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-8"
        >
          Quiet visual archive of recent public shares. Drop local files to publish straight to the database with polished Discord embeds. Soft size warnings only.
        </motion.p>

        <div className="grid md:grid-cols-[1fr_280px] gap-6 mb-10">
          <motion.div
            className="glass rounded-3xl p-8 text-center cursor-pointer border border-white/10 hover:border-white/25"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
            }}
            whileHover={{ scale: 1.004 }}
            whileTap={{ scale: 0.996 }}
          >
            <input ref={inputRef} type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="archive-drop" multiple />
            <label htmlFor="archive-drop" className="cursor-pointer block">
              <div className="text-neutral-400 text-sm">drop files into the archive</div>
              <div className="text-xs text-neutral-500 mt-1">multiple welcome · no hard limits</div>
            </label>
          </motion.div>

          <div className="space-y-3">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="caption for Discord cards"
              className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-400">accent</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-full border-0" />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={shareAll}
              disabled={!files.length || status === 'uploading'}
              className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50"
            >
              {status === 'uploading' ? 'publishing…' : `publish ${files.length || ''}`}
            </motion.button>
            {large && <p className="text-amber-400 text-xs">large files. upload may feel slow. no hard limit.</p>}
          </div>
        </div>

        <div className="flex gap-2 mb-6 text-xs">
          {['all', 'image', 'video', 'audio'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full ${filter === f ? 'bg-white text-black' : 'glass text-neutral-300'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-neutral-500 text-sm">loading archive…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={shareUrls(s.id).embed}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 16 }}
                  className="glass rounded-2xl overflow-hidden aspect-square flex flex-col group hover:border-white/20"
                  whileHover={{ y: -2 }}
                >
                  {s.type?.startsWith('image') && s.fileUrl ? (
                    <img src={s.fileUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex-1 grid place-items-center text-neutral-500 text-xs px-2 text-center">
                      {s.name}
                    </div>
                  )}
                  <div className="p-2 text-[10px] text-neutral-400 truncate">{s.name}</div>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
