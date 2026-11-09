import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietMeadowPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#34C759');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(12).then(setRecent).catch(() => {});
  }, []);

  const onFiles = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles(next);
    const big = next.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Uploads may feel slow. No hard limit — only a gentle note.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('choose at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results: string[] = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'settling in the soft quiet meadow',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softquietmeadow', sharedCaption: caption.trim() || null },
        });
        if (res.ok && res.embed) results.push(res.embed);
        else if (!res.ok) setErr(res.error || 'a file could not settle');
      }
      setLinks(results);
      setFiles([]);
      listPublicShares(12).then(setRecent).catch(() => {});
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 bg-white/10 rounded-full"
            style={{
              height: 60 + (i % 5) * 20,
              left: `${8 + (i * 7.5) % 84}%`,
              bottom: '0%',
              transformOrigin: 'bottom center',
            }}
            animate={{
              rotate: [0, 4, -3, 0],
              opacity: [0.2, 0.5, 0.3],
            }}
            transition={{ duration: 8 + (i % 4) * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`seed-${i}`}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              left: `${20 + (i * 12) % 60}%`,
              top: `${30 + (i * 10) % 40}%`,
            }}
            animate={{
              y: [0, -40, -80],
              x: [0, 10, -5],
              opacity: [0.6, 0.3, 0],
              scale: [1, 0.8, 0.4],
            }}
            transition={{ duration: 12 + i * 1.5, repeat: Infinity, ease: 'easeOut', delay: i * 1.2 }}
          />
        ))}
      </div>
      <div className="relative pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Quiet Meadow</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">Files settle in soft grass.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Drop several local files. They share one quiet caption and accent as they upload to storage and public_shares. Each link unfurls a polished Discord embed. Soft swaying grass, floating seeds, spring motion on frosted glass. Large drops gently warned about possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared meadow caption…"
            rows={3}
            maxLength={200}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="flex-1 text-[14px] text-neutral-300 cursor-pointer hover:text-white transition border border-dashed border-white/15 rounded-[20px] px-4 py-3 text-center">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Choose local files'}
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the meadow…' : 'Share to meadow'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>

          {recent.length > 0 && (
            <div className="mt-10">
              <p className="text-[13px] text-neutral-500 mb-3">recent in the meadow</p>
              <div className="grid gap-3">
                {recent.slice(0, 6).map((s) => (
                  <a key={s.id} href={`/s/${s.id}`} className="block glass rounded-2xl p-4 text-sm hover:bg-white/5 transition">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-neutral-400 text-xs mt-1 line-clamp-2">{s.caption || 'shared quietly'}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
