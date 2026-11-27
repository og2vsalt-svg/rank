import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function VelvetDriftPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('velvet drift');
  const [caption, setCaption] = useState('soft files in gentle motion');
  const [accent, setAccent] = useState('#BF5AF2');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [items, setItems] = useState<{ id: string; name: string; url: string; thumb?: string; size: number }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  const pretty = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    setWarn(null);
    const fresh: typeof items = [];
    for (const file of list) {
      if (file.size > 40 * 1024 * 1024) setWarn('large drop. the browser may feel slow while it drifts. nothing is blocked.');
      let thumb: string | undefined;
      if (file.type.startsWith('image/')) {
        try { thumb = URL.createObjectURL(file); } catch {}
      }
      try {
        const pub = await publishLocalFile(file, {
          caption,
          cardTitle: title || file.name,
          color: accent,
          meta: { desk: 'velvetdrift' },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          fresh.push({ id: pub.id, name: file.name, url: urls.embed, thumb, size: file.size });
        }
      } catch {}
    }
    setItems((prev) => [...fresh, ...prev]);
    setBusy(false);
    listPublicShares(6).then(setRecent).catch(() => {});
  }, [title, caption, accent]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#BF5AF2] text-sm tracking-wide mb-3">velvet drift</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">soft files<br />in gentle drift.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Shape a shared title, caption, and accent. Drop local files. They upload to the share database and settle into a living drift with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Prior desks remain untouched.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/25" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption" className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/25" />
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded-full border-0 bg-transparent cursor-pointer" />
            <span className="text-xs text-neutral-500">drift accent</span>
          </div>
        </div>

        <motion.div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          animate={{ scale: dragging ? 1.01 : 1, borderColor: dragging ? accent : 'rgba(255,255,255,0.08)' }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative border-2 border-dashed rounded-3xl p-16 text-center bg-white/[0.02] backdrop-blur-2xl cursor-pointer mb-12"
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          <AnimatePresence mode="wait">
            {busy ? (
              <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-white/20 animate-spin" style={{ borderTopColor: accent }} />
                <p className="mt-4 text-sm text-neutral-400">drifting into place…</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-16 h-16 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ background: accent + '22', color: accent }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18"/></svg>
                </div>
                <p className="text-xl font-medium mb-1">Drop files to drift</p>
                <p className="text-sm text-neutral-500">or click to browse. Large files may feel slow — nothing is refused.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {warn && <p className="text-center text-sm text-amber-400 mb-8">{warn}</p>}

        {items.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-16">
            <p className="text-sm text-neutral-400 mb-6 text-center">your drift — click any to copy its Discord link</p>
            <div className="flex flex-wrap justify-center gap-5">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20, rotate: i % 2 === 0 ? -3 : 3 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 130, damping: 17, delay: i * 0.07 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="glass rounded-2xl p-4 w-44 text-center cursor-pointer"
                  style={{ boxShadow: `0 12px 40px ${accent}28` }}
                  onClick={() => navigator.clipboard.writeText(item.url)}
                >
                  {item.thumb ? <img src={item.thumb} alt="" className="w-full h-24 object-cover rounded-xl mb-2" /> : <div className="w-full h-24 rounded-xl mb-2" style={{ background: accent + '33' }} />}
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-neutral-500">{pretty(item.size)}</p>
                  <p className="text-[10px] mt-1" style={{ color: accent }}>copy link</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {recent.length > 0 && (
          <div className="mb-12">
            <p className="text-sm text-neutral-400 mb-5 text-center">recent public drifts</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={`/s/${s.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 110, damping: 18 }}
                  whileHover={{ y: -5 }}
                  className="glass rounded-2xl p-4 block"
                >
                  <div className="aspect-video rounded-xl mb-3 overflow-hidden" style={{ background: (s.color || accent) + '18' }}>
                    {s.type?.startsWith('image/') && s.url ? <img src={s.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-xs text-neutral-500">{s.type?.split('/')[1] || 'file'}</div>}
                  </div>
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{pretty(s.size)}</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => navigate('home')} className="mt-8 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
