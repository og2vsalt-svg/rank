import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietLumenBloomPage() {
  const [text, setText] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [shares, setShares] = useState<CloudMeta[]>([]);

  const loadShares = async () => {
    const list = await listPublicShares(9);
    setShares(list);
  };

  useEffect(() => { loadShares(); }, []);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. The upload may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const save = async () => {
    if (!text.trim() && files.length === 0) return setErr('add a note or drop files');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      let lastEmbed: string | null = null;
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: text.trim() || `blooming from quiet lumen bloom`,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quietlumenbloom' },
        });
        if (res.ok && res.embed) lastEmbed = res.embed;
        else if (!res.ok) setErr(res.error || 'upload slowed');
      }
      if (text.trim() && files.length === 0) {
        const noteBlob = new File([text.trim()], 'quiet-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(noteBlob, {
          caption: text.trim(),
          color: accent,
          cardTitle: 'quiet note',
          meta: { desk: 'quietlumenbloom', kind: 'note' },
        });
        if (res.ok && res.embed) lastEmbed = res.embed;
      }
      setLink(lastEmbed);
      setFiles([]);
      setText('');
      await loadShares();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl mb-16"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Lumen Bloom</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">Blooms of shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Soft petals of your accent gently expand from a quiet center. Drop local files or leave a note — they upload to storage and public_shares. Every share link carries a polished Discord embed. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A quiet note to bloom with the light…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-5 py-4 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex flex-wrap items-center gap-5 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="text-[14px] text-neutral-300 cursor-pointer hover:text-white transition flex items-center gap-2">
              <span>{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Drop local files'}</span>
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={save}
            disabled={busy || (!text.trim() && files.length === 0)}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Blooming…' : 'Send into bloom'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.a
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                href={link}
                className="block mt-6 text-[13px] break-all"
                style={{ color: accent }}
              >
                {link}
              </motion.a>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="relative h-[420px] mx-auto max-w-md">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-4 h-4 rounded-full"
              style={{ background: accent, boxShadow: `0 0 32px ${accent}80` }}
            />
          </div>
          {shares.map((s, i) => {
            const angle = (i / Math.max(shares.length, 1)) * Math.PI * 2;
            const radius = 140 + (i % 2) * 30;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x,
                  y,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 50,
                  damping: 14,
                  delay: i * 0.1,
                }}
                whileHover={{ scale: 1.1 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass rounded-full px-5 py-3 shadow-xl max-w-[130px] text-center block"
                style={{ borderColor: `${accent}40` }}
              >
                <p className="text-[11px] font-medium text-white truncate">{s.name || 'shared light'}</p>
              </motion.a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
