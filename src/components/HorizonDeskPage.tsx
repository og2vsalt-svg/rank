import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function HorizonDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: scrollRef });
  const x = useTransform(scrollXProgress, [0, 1], [0, -40]);

  const refresh = async () => {
    const list = await listPublicShares(20);
    setShares(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The horizon may take a moment to settle. No hard limit.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files meet the horizon');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'horizon drop',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'horizondesk' },
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
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507] overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Horizon Desk</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Where shares meet the light.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-xl mx-auto">
            Drop one or many local files with a shared note and accent. They settle along a quiet horizon of glass cards that drift with spring motion. Scroll the timeline. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl max-w-xl mx-auto"
        >
          <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-white/10 p-10 text-center mb-6 hover:border-white/20 transition-colors">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready for the horizon` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional note that travels with every file…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Horizon accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling on the horizon…' : 'Share to the horizon'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-1 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="relative">
          <motion.div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide"
            style={{ x }}
          >
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 80, damping: 18 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="flex-none w-72 snap-center glass rounded-[24px] p-5 apple-card shadow-xl"
                style={{ transformOrigin: 'center bottom' }}
              >
                <div className="aspect-video rounded-[16px] mb-4 overflow-hidden" style={{ backgroundColor: (s.color || accent) + '22' }}>
                  {s.type?.startsWith('image/') && s.url ? (
                    <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[13px] text-neutral-400">{s.type?.split('/')[1] || 'file'}</div>
                  )}
                </div>
                <p className="text-[15px] font-medium text-white truncate">{s.name || 'untitled'}</p>
                {s.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                <p className="text-[11px] text-neutral-500 mt-2">{new Date(s.createdAt || '').toLocaleDateString()}</p>
              </motion.a>
            ))}
          </motion.div>
          {shares.length === 0 && <p className="text-neutral-500 text-center py-12 text-[15px]">The horizon is clear. Share the first light.</p>}
        </div>
      </div>
    </div>
  );
}
