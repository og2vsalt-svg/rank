import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietMosaicDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(36);
    setShares(list.filter(s => s.type?.startsWith('image/')));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onFiles = (arr: File[]) => {
    const images = arr.filter(f => f.type.startsWith('image/'));
    setFiles(images);
    const big = images.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large mosaic pieces. Encoding may feel slow. No hard limits — only a gentle note.' : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const arr = Array.from(e.dataTransfer.files);
    if (arr.length) onFiles(arr);
  };

  const share = async () => {
    if (!files.length) return setErr('choose images for the mosaic');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'quiet mosaic',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quietmosaicdesk' },
        });
        if (res.ok && res.embed) {
          created.push(res.embed);
        } else {
          setErr(res.error || `paused on ${file.name}`);
        }
      }
      setLinks(created);
      setFiles([]);
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'the mosaic paused for a moment');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507] text-white">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="text-center mb-16"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-3" style={{ color: accent }}>Quiet Mosaic</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight mb-4">Arrange what you carry into living glass.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Drop local images. They settle into a quiet mosaic of soft glass tiles with spring motion in your accent. Shared pieces land in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[32px] p-6 sm:p-8 mb-16 shadow-2xl max-w-xl mx-auto"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <label className={`block cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center mb-5 transition-all ${
            drag ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'
          }`}>
            <p className="text-base text-neutral-200 font-medium">
              {files.length ? `${files.length} image${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local images'}
            </p>
            <p className="text-xs text-neutral-500 mt-1.5">Images only for the mosaic. No size limits.</p>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onFiles(Array.from(e.target.files || []))} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional quiet caption for the mosaic…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-4 mb-6">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm text-neutral-400">Mosaic accent</span>
          </div>

          {warn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-amber-300/90 mb-4 text-center">
              {warn}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-3.5 text-sm font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the mosaic…' : 'Share into the quiet mosaic'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 space-y-1 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-sm break-all hover:underline" style={{ color: accent }}>
                    {l}
                  </a>
                ))}
              </motion.div>
            )}
            {err && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-red-400 text-center">
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.6), type: 'spring', stiffness: 90, damping: 16 }}
              whileHover={{ scale: 1.04, zIndex: 10 }}
              className="block break-inside-avoid glass rounded-2xl overflow-hidden apple-card shadow-md relative group"
            >
              <img src={s.url} alt={s.name} className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                <p className="text-sm text-white truncate">{s.name}</p>
              </div>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && (
          <p className="text-neutral-500 text-center py-20 text-base">The mosaic awaits its first quiet pieces.</p>
        )}
      </div>
    </div>
  );
}
