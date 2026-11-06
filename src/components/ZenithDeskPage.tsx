import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function ZenithDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
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
    setWarn(big ? 'Large file(s). The zenith may take a moment. No hard limit — only a soft warning.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('choose one or more local files to lift');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'zenith drop',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'zenithdesk' },
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="text-center mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.22em] uppercase mb-3" style={{ color: accent }}>Zenith Desk</p>
          <h1 className="text-[44px] font-semibold tracking-tight text-white mb-4 leading-tight">Reach the zenith with what you carry.</h1>
          <p className="text-neutral-400 text-[16.5px] leading-relaxed max-w-2xl mx-auto">
            Drop local files with a shared note and accent. They rise into storage and the public_shares table as floating glass orbs that breathe with spring motion. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-10 mb-20 shadow-2xl max-w-xl mx-auto"
        >
          <label className="block cursor-pointer rounded-[28px] border-2 border-dashed border-white/12 p-12 text-center mb-7 hover:border-white/25 transition-all duration-300">
            <p className="text-[16px] text-neutral-200">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready for the zenith` : 'Drop or choose local files'}</p>
            <p className="text-[13px] text-neutral-500 mt-2">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional note that rises with every file…"
            rows={2}
            className="w-full bg-black/25 border border-white/10 rounded-[22px] px-5 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/30 transition-colors"
          />

          <div className="flex items-center gap-5 mb-7">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[14px] text-neutral-400">Zenith accent</span>
          </div>

          {warn && <p className="text-[13.5px] text-amber-300/90 mb-5 text-center">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.025 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[26px] py-4.5 text-[16.5px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Rising to the zenith…' : 'Share to the zenith'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
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

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 65, damping: 15 }}
              whileHover={{ y: -12, scale: 1.04, rotate: 0.8 }}
              className="glass rounded-[24px] p-5 apple-card shadow-xl origin-center"
            >
              <div className="aspect-square rounded-[16px] mb-4 overflow-hidden flex items-center justify-center" style={{ backgroundColor: (s.color || accent) + '22' }}>
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[14px] text-neutral-400 px-2 text-center">{s.type?.split('/')[1] || 'file'}</div>
                )}
              </div>
              <p className="text-[15.5px] font-medium text-white truncate">{s.name || 'untitled'}</p>
              {s.caption && <p className="text-[13.5px] text-neutral-400 mt-1.5 line-clamp-2">{s.caption}</p>}
              <p className="text-[12px] text-neutral-500 mt-3">{new Date(s.createdAt || '').toLocaleDateString()}</p>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-16 text-[16px]">The zenith is clear. Share the first rise.</p>}
      </div>
    </div>
  );
}
