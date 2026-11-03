import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function MeridianBoardPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

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
    setWarn(big ? 'Large file(s). The board may take a moment to settle. No hard limit.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('place one or more files on the meridian');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'meridian board',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'meridianboard' },
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
      <div className="pt-28 pb-32 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="text-center mb-10"
        >
          <p className="text-[13px] font-medium tracking-[0.18em] uppercase mb-2" style={{ color: accent }}>Meridian Board</p>
          <h1 className="text-[38px] font-semibold tracking-tight text-white mb-3">Align what you carry.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-2xl mx-auto">
            Drop local files with a shared note and accent. They enter storage and public_shares. Recent public drops settle into a horizontal meridian of glass cards that drift with spring motion. Every share link opens a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 120, damping: 24 }}
          className="glass rounded-[28px] p-7 mb-12 shadow-2xl max-w-lg mx-auto"
        >
          <label className="block cursor-pointer rounded-[20px] border-2 border-dashed border-white/10 p-8 text-center mb-5 hover:border-white/25 transition-colors">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional note that travels with every file…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-3 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Board accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-3.5 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling on the board…' : 'Share to the meridian'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 space-y-1 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[13px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="overflow-x-auto pb-4 -mx-5 px-5">
          <div className="flex gap-5 min-w-max snap-x snap-mandatory">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 70, damping: 18 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="glass rounded-[22px] p-4 w-64 flex-shrink-0 snap-start apple-card shadow-xl"
              >
                <div className="aspect-[4/3] rounded-[14px] mb-3 overflow-hidden" style={{ backgroundColor: (s.color || accent) + '18' }}>
                  {s.type?.startsWith('image/') && s.url ? (
                    <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[12px] text-neutral-400">{s.type?.split('/')[1] || 'file'}</div>
                  )}
                </div>
                <p className="text-[15px] font-medium text-white truncate">{s.name || 'untitled'}</p>
                {s.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                <p className="text-[11px] text-neutral-500 mt-1.5">{new Date(s.createdAt || '').toLocaleDateString()}</p>
              </motion.a>
            ))}
          </div>
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-12 text-[15px]">The meridian is clear. Place the first file.</p>}
      </div>
    </div>
  );
}
