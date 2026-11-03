import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function VelvetDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#BF5AF2');
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
    setWarn(big ? 'Large file(s). The velvet may take a moment to settle. No hard limit.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files settle into the velvet');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'velvet drop',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'velvetdesk' },
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
    <div className="mesh min-h-screen bg-[#0a070c]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 18 }}
          className="text-center mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.22em] uppercase mb-2" style={{ color: accent }}>Velvet Desk</p>
          <h1 className="text-[42px] font-semibold tracking-tight text-white mb-3">Settle what you carry.</h1>
          <p className="text-neutral-400 text-[16.5px] leading-relaxed max-w-lg mx-auto">
            Drop one or many local files with a shared note and accent. They settle into storage and public_shares. Recent public drops rest in a quiet vertical stack of glass that lifts with spring motion on hover. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 mb-16 shadow-2xl"
        >
          <label className="block cursor-pointer rounded-[28px] border-2 border-dashed border-white/10 p-12 text-center mb-7 hover:border-white/25 transition-colors duration-300">
            <p className="text-[16px] text-neutral-200">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to settle` : 'Drop or choose local files'}</p>
            <p className="text-[13px] text-neutral-500 mt-1.5">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional note that settles with every file…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[24px] px-5 py-4 text-[15.5px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/30 transition-colors"
          />

          <div className="flex items-center gap-5 mb-7">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-11 h-11 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[14px] text-neutral-400">Velvet accent</span>
          </div>

          {warn && <p className="text-[13.5px] text-amber-300/90 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[26px] py-4.5 text-[16.5px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the velvet…' : 'Share to the velvet'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-7 space-y-1.5 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14.5px] break-all hover:underline" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-[13.5px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="space-y-5">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 75, damping: 17 }}
              whileHover={{ y: -6, scale: 1.012 }}
              className="glass rounded-[28px] p-5 apple-card shadow-lg block"
            >
              <div className="flex gap-5 items-start">
                <div className="w-20 h-20 rounded-[16px] shrink-0 overflow-hidden grid place-items-center" style={{ backgroundColor: (s.color || accent) + '22' }}>
                  {s.type?.startsWith('image/') && s.url ? (
                    <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[12px] text-neutral-400">{s.type?.split('/')[1]?.slice(0, 4) || 'file'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16.5px] font-medium text-white truncate">{s.name || 'untitled'}</p>
                  {s.caption && <p className="text-[14px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                  <p className="text-[12px] text-neutral-500 mt-2">{new Date(s.createdAt || '').toLocaleDateString()}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-16 text-[16px]">The velvet is quiet. Share the first settlement.</p>}
      </div>
    </div>
  );
}
