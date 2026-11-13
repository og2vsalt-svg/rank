import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietEquinoxPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
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
    const big = arr.some(f => f.size > 45 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The equinox may take a moment to balance. No hard limit.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files find balance');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'equinox balance',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quietequinox' },
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

  const left = shares.slice(0, Math.ceil(shares.length / 2));
  const right = shares.slice(Math.ceil(shares.length / 2));

  return (
    <div className="mesh min-h-screen bg-gradient-to-b from-[#080a12] via-[#0c1018] to-[#101418]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="text-center mb-16"
        >
          <p className="text-[13px] font-medium tracking-[0.28em] uppercase mb-3" style={{ color: accent }}>Quiet Equinox</p>
          <h1 className="text-[44px] sm:text-[52px] font-semibold tracking-tight text-white mb-4">where files find balance</h1>
          <p className="text-[16.5px] text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Drop one or many local files with a shared note and accent. They settle into balanced dual columns of frosted glass with gentle spring motion. Batch-publish to the database. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl border border-white/10"
        >
          <label className="block mb-6">
            <span className="text-[14px] text-neutral-300 mb-2 block">Files to balance</span>
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
              placeholder="a quiet note for the equinox"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 outline-none focus:border-white/20 transition"
            />
          </label>

          <div className="flex items-center gap-5 mb-7">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[14px] text-neutral-400">Equinox accent</span>
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
            {busy ? 'Finding balance…' : 'Share to the equinox'}
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

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {left.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: -20, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 70, damping: 16 }}
                whileHover={{ x: 4, scale: 1.015 }}
                className="glass rounded-[28px] p-5 apple-card shadow-lg block relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle at 20% 30%, ${s.color || accent}40, transparent 55%)` }} />
                <div className="relative flex gap-4 items-start">
                  <div className="w-14 h-14 rounded-[12px] shrink-0 overflow-hidden grid place-items-center" style={{ backgroundColor: (s.color || accent) + '22' }}>
                    {s.type?.startsWith('image/') && s.url ? (
                      <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-neutral-400">file</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-medium text-white truncate">{s.name || 'untitled'}</p>
                    <p className="text-[12.5px] text-neutral-400 mt-0.5 line-clamp-2">{s.caption || 'equinox share'}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
          <div className="space-y-6">
            {right.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: 20, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: i * 0.06 + 0.1, type: 'spring', stiffness: 70, damping: 16 }}
                whileHover={{ x: -4, scale: 1.015 }}
                className="glass rounded-[28px] p-5 apple-card shadow-lg block relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle at 80% 30%, ${s.color || accent}40, transparent 55%)` }} />
                <div className="relative flex gap-4 items-start">
                  <div className="w-14 h-14 rounded-[12px] shrink-0 overflow-hidden grid place-items-center" style={{ backgroundColor: (s.color || accent) + '22' }}>
                    {s.type?.startsWith('image/') && s.url ? (
                      <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-neutral-400">file</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-medium text-white truncate">{s.name || 'untitled'}</p>
                    <p className="text-[12.5px] text-neutral-400 mt-0.5 line-clamp-2">{s.caption || 'equinox share'}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
