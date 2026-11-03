import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function HaloDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(16);
    setShares(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The halo may take a quiet moment to settle. No hard limit.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files join the halo');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'halo drop',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'halodesk' },
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
    <div className="mesh min-h-screen bg-[#050507]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 22 }}
          className="text-center mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.22em] uppercase mb-2" style={{ color: accent }}>Halo Desk</p>
          <h1 className="text-[42px] font-semibold tracking-tight text-white mb-3">Let it rest in the light.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-2xl mx-auto">
            Drop one or many local files with a shared note and accent. They enter storage and public_shares. Recent public drops settle into a soft halo of glass that drifts and glows with spring motion. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 24 }}
          className="glass rounded-[36px] p-8 mb-16 shadow-2xl max-w-lg mx-auto"
        >
          <label className="block cursor-pointer rounded-[28px] border-2 border-dashed border-white/10 p-12 text-center mb-6 hover:border-white/25 transition-colors duration-300">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready for the halo` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1.5">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional note that settles with every file…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[22px] px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/30 transition-colors"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-11 h-11 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Halo accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[24px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the halo…' : 'Share to the halo'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-1.5 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all hover:opacity-80 transition" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 60, damping: 18 }}
              whileHover={{ y: -12, scale: 1.04, rotate: i % 2 === 0 ? 1.2 : -1.2 }}
              className="glass rounded-[22px] p-4 apple-card shadow-lg origin-center"
            >
              <div className="aspect-square rounded-[14px] mb-3 overflow-hidden" style={{ backgroundColor: (s.color || accent) + '14' }}>
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
        {shares.length === 0 && <p className="text-neutral-500 text-center py-16 text-[15px]">The halo is empty. Share the first light.</p>}
      </div>
    </div>
  );
}
