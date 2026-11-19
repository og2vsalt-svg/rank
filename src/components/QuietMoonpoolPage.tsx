import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietMoonpoolPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#C7C7CC');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [ripples, setRipples] = useState<{id: number; x: number; y: number}[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(12);
    setShares(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    setCaptions(arr.map(() => ''));
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The moonpool may take a moment to still. No hard limit.' : null);
  };

  const updateCaption = (i: number, val: string) => {
    const next = [...captions];
    next[i] = val;
    setCaptions(next);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files settle into the moonpool');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cap = captions[i]?.trim() || sharedCaption.trim() || 'moonpool drop';
        const res = await publishLocalFile(file, {
          caption: cap,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quietmoonpool' },
        });
        if (res.ok && res.embed) {
          created.push(res.embed);
        } else {
          setErr(res.error || `paused on ${file.name}`);
        }
      }
      setLinks(created);
      setFiles([]);
      setCaptions([]);
      setSharedCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  const onGlassClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rr => rr.id !== id)), 2000);
  };

  return (
    <div className="mesh min-h-screen bg-[#0a0a12]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Quiet Moonpool</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Under the silver light.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-xl mx-auto">
            Drop local files into a quiet moonpool. Soft silver ripples expand on touch. Give each its own quiet caption, or share one. They settle into the database with a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl max-w-xl mx-auto relative overflow-hidden"
          onClick={onGlassClick}
        >
          {ripples.map(r => (
            <motion.div
              key={r.id}
              className="absolute rounded-full border border-white/15 pointer-events-none"
              style={{ left: `${r.x}%`, top: `${r.y}%`, width: 6, height: 6, transform: 'translate(-50%, -50%)' }}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 14, opacity: 0 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
            />
          ))}

          <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-white/10 p-10 text-center mb-6 hover:border-white/20 transition-colors relative z-10">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to settle` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow. Click the glass for silver ripples.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          {files.length > 0 && (
            <div className="space-y-3 mb-5 relative z-10">
              {files.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-[12px] text-neutral-400 truncate flex-1">{f.name}</span>
                  <input
                    value={captions[i] || ''}
                    onChange={(e) => updateCaption(i, e.target.value)}
                    placeholder="quiet caption"
                    className="bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-[13px] text-white placeholder:text-neutral-500 flex-1 focus:outline-none focus:border-white/25"
                  />
                </div>
              ))}
            </div>
          )}

          <input
            value={sharedCaption}
            onChange={(e) => setSharedCaption(e.target.value)}
            placeholder="Optional shared note for every file…"
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/25 relative z-10"
          />

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Moonlight accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4 relative z-10">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl relative z-10"
            style={{ background: accent, color: '#0a0a12' }}
          >
            {busy ? 'Settling under the moon…' : 'Share to the moonpool'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-1 text-center relative z-10"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 text-center relative z-10">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 70, damping: 16 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass rounded-[20px] p-4 apple-card shadow-lg"
            >
              <div className="aspect-[4/5] rounded-[12px] mb-3 overflow-hidden" style={{ backgroundColor: (s.color || accent) + '18' }}>
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[13px] text-neutral-400">{s.type?.split('/')[1] || 'file'}</div>
                )}
              </div>
              <p className="text-[15px] font-medium text-white truncate px-1">{s.name || 'untitled'}</p>
              {s.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2 px-1">{s.caption}</p>}
              <p className="text-[11px] text-neutral-500 mt-2 px-1">{new Date(s.createdAt || '').toLocaleDateString()}</p>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-12 text-[15px]">The moonpool is still. Share the first silver ripple.</p>}
      </div>
    </div>
  );
}
