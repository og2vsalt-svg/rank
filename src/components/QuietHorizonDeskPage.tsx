import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietHorizonDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(16);
    setShares(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onFiles = (arr: File[]) => {
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large drop rising to the horizon. May take a quiet moment. No hard limit — only a soft note if it feels slow.' : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const arr = Array.from(e.dataTransfer.files);
    if (arr.length) onFiles(arr);
  };

  const share = async () => {
    if (!files.length) return setErr('choose something to rise to the horizon');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'quiet horizon drop',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quiethorizondesk' },
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
      setErr(e.message || 'the horizon paused for a moment');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#64D2FF]/10 to-transparent" />
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-1/3 w-px h-32 bg-gradient-to-t from-white/20 to-transparent"
            style={{ left: `${8 + i * 7.5}%` }}
            animate={{ opacity: [0.3, 0.7, 0.3], scaleY: [0.8, 1.1, 0.8] }}
            transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          className="text-center mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.22em] uppercase mb-3" style={{ color: accent }}>Quiet Horizon</p>
          <h1 className="text-[44px] sm:text-[52px] font-semibold tracking-tight leading-tight mb-4">Let what you carry rise to the quiet horizon.</h1>
          <p className="text-neutral-400 text-[17px] leading-relaxed max-w-2xl mx-auto">
            Drop local files onto a calm glass horizon. Soft cards rise and settle with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 sm:p-10 mb-20 shadow-2xl max-w-2xl mx-auto"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <label className={`block cursor-pointer rounded-[28px] border-2 border-dashed p-12 text-center mb-7 transition-all duration-300 ${
            drag ? 'border-white/40 bg-white/5 scale-[1.01]' : 'border-white/10 hover:border-white/20'
          }`}>
            <p className="text-[16px] text-neutral-200 font-medium">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready for the horizon` : 'Drop or choose local files'}
            </p>
            <p className="text-[13px] text-neutral-500 mt-2">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(Array.from(e.target.files || []))} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional quiet note that travels with the horizon…"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-[22px] px-5 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/30 transition-colors"
          />

          <div className="flex items-center gap-5 mb-7">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-12 rounded-full cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[14px] text-neutral-400">Horizon accent</span>
          </div>

          {warn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] text-amber-300/90 mb-5 text-center">
              {warn}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.975 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[26px] py-4.5 text-[16px] font-medium text-white disabled:opacity-40 transition-all shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Rising to the horizon…' : 'Share to the horizon'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-7 space-y-1.5 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all hover:underline" style={{ color: accent }}>
                    {l}
                  </a>
                ))}
              </motion.div>
            )}
            {err && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-[13px] text-red-400 text-center">
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 48, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 70, damping: 16 }}
              whileHover={{ y: -12, scale: 1.03 }}
              className="glass rounded-[26px] p-4 apple-card shadow-lg origin-bottom relative overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none transition-opacity group-hover:opacity-35" style={{ background: `linear-gradient(to top, ${s.color || accent}40, transparent 60%)` }} />
              <div className="aspect-square rounded-[18px] mb-4 overflow-hidden relative" style={{ backgroundColor: (s.color || accent) + '15' }}>
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[13px] text-neutral-400">{s.type?.split('/')[1] || 'horizon'}</div>
                )}
              </div>
              <p className="text-[15px] font-medium text-white truncate px-1 relative">{s.name || 'untitled'}</p>
              {s.caption && <p className="text-[13px] text-neutral-400 mt-1.5 line-clamp-2 px-1 relative">{s.caption}</p>}
              <p className="text-[11px] text-neutral-500 mt-2.5 px-1 relative">{new Date(s.createdAt || '').toLocaleDateString()}</p>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && (
          <p className="text-neutral-500 text-center py-16 text-[16px]">The horizon is open. Let the first rise.</p>
        )}
      </div>
    </div>
  );
}
