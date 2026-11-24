import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CentralDropPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(12).then(setRecent);
  }, []);

  const handleFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.some(f => f.size > 60 * 1024 * 1024);
    setWarn(big ? 'Large file(s) detected — may take a moment. Soft warning only. No hard limits.' : null);
    setResults([]);
  }, []);

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const links: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color,
          cardTitle: file.name.replace(/\.[^.]+$/, ''),
          meta: { desk: 'centraldrop' },
        });
        if (res.ok && res.id) {
          links.push(shareUrls(res.id).app);
          setResults([...links]);
        }
      }
      listPublicShares(12).then(setRecent);
    } catch {
      // partial success ok
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5 mb-12"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Central Drop</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Everything in one place.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            The central desk for local files. Drop one or many, shape a shared caption and accent, and cascade permanent shares. Every link ships with a polished Discord embed. Soft size warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop files here'}</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse · multiple supported</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 mb-6 overflow-hidden">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Optional shared caption"
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-neutral-400">Accent</label>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
                </div>
                {warn && <p className="text-[13px] text-amber-300/80">{warn}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Cascading shares…' : files.length ? 'Publish central shares' : 'Drop files first'}
          </motion.button>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-2">
                {results.map((link, i) => (
                  <motion.div key={link} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className="glass rounded-2xl p-3">
                    <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm break-all text-left">{link}</button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {recent.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-semibold text-white mb-4">Recent shares</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recent.map((s) => (
                <motion.button
                  key={s.id}
                  onClick={() => navigate('share', s.id)}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl p-4 text-left"
                >
                  <p className="text-sm font-medium text-white truncate">{s.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{s.caption?.slice(0, 40) || 'shared file'}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
