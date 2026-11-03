import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function AuroraDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
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
    const big = arr.some(f => f.size > 50 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The aurora may take a moment to rise. No hard limit.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files rise into the aurora');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'aurora drop',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'auroradesk' },
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
    <div className="mesh min-h-screen bg-gradient-to-b from-[#05070f] via-[#0a0e1a] to-[#0d1224]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="text-center mb-16"
        >
          <p className="text-[13px] font-medium tracking-[0.28em] uppercase mb-3" style={{ color: accent }}>Aurora Desk</p>
          <h1 className="text-[44px] sm:text-[52px] font-semibold tracking-tight text-white mb-4">where light rises</h1>
          <p className="text-[16.5px] text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Drop one or many local files with a shared note and accent. They rise into storage and public_shares. Recent public drops settle as soft aurora cards that lift with spring motion and a gentle breathing glow. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl border border-white/10"
        >
          <label className="block mb-6">
            <span className="text-[14px] text-neutral-300 mb-2 block">Files to rise</span>
            <input
              type="file"
              multiple
              onChange={onFiles}
              className="block w-full text-[14px] text-neutral-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-[13.5px] file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/15 transition"
            />
          </label>

          <label className="block mb-6">
            <span className="text-[14px] text-neutral-300 mb-2 block">Shared note</span>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="a quiet note for the aurora"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 outline-none focus:border-white/20 transition"
            />
          </label>

          <div className="flex items-center gap-5 mb-7">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[14px] text-neutral-400">Aurora accent</span>
          </div>

          {warn && <p className="text-[13.5px] text-amber-300/90 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[26px] py-4.5 text-[16.5px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Rising into the aurora…' : 'Share to the aurora'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
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

        <div className="grid gap-6 sm:grid-cols-2">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 70, damping: 16 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass rounded-[28px] p-5 apple-card shadow-lg block relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 20%, ${s.color || accent}40, transparent 60%)` }} />
              <div className="relative flex gap-4 items-start">
                <div className="w-16 h-16 rounded-[14px] shrink-0 overflow-hidden grid place-items-center" style={{ backgroundColor: (s.color || accent) + '22' }}>
                  {s.type?.startsWith('image/') && s.url ? (
                    <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-neutral-400">file</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-white truncate">{s.name || 'untitled'}</p>
                  <p className="text-[13px] text-neutral-400 mt-0.5 line-clamp-2">{s.caption || 'aurora share'}</p>
                  <p className="text-[12px] text-neutral-500 mt-1.5">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
