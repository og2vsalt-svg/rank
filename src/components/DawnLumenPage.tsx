import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function DawnLumenPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9500');
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
    setWarn(big ? 'Large file(s). Dawn may settle slowly. No hard limit.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files join the dawn');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'from the dawn lumen',
          color: accent,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'dawnlumen' },
        });
        if (res.ok && res.embed) created.push(res.embed);
        else setErr(res.error || `paused on ${file.name}`);
      }
      setLinks(created);
      setFiles([]);
      setTitle('');
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Dawn Lumen</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Light that gathers at dawn.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-2xl mx-auto">
            Drop several local files. Shape a shared title, caption, and warm accent. They rise into a soft dawn with staggered Apple springs. Recent shares form a living gallery. Every link ships with a polished Discord embed. Soft size warnings only. No hard limits. Prior features stay intact.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 110, damping: 24 }}
          className="glass rounded-[36px] p-8 mb-16 shadow-2xl max-w-lg mx-auto"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shared title"
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/25"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared caption…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/25"
          />

          <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-white/10 p-10 text-center mb-5 hover:border-white/25 transition-colors">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Dawn accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Gathering dawn…' : 'Share to dawn'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-1 text-center">
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 70, damping: 18 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="glass rounded-[20px] p-4 shadow-lg"
              style={{ boxShadow: `0 0 20px 4px ${(s.color || accent)}22` }}
            >
              <div className="aspect-video rounded-[14px] mb-3 overflow-hidden bg-black/20">
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[13px] text-neutral-400">{s.name || 'file'}</div>
                )}
              </div>
              <p className="text-[14px] font-medium text-white truncate">{s.name || 'untitled'}</p>
              {s.caption && <p className="text-[12px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-12">The dawn is quiet. Share the first light.</p>}
      </div>
    </div>
  );
}
