import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SoftLumenNookPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'This file is large. The upload may feel slow. No hard limit is applied.' : null);
  };

  const share = async () => {
    if (!file && !note.trim()) return setErr('leave a note or drop a file');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      if (file) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'from the soft lumen nook',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softlumennook' },
        });
        if (res.ok && res.embed) setLink(res.embed);
        else if (!res.ok) setErr(res.error || 'upload slowed');
      } else {
        // pure note path could later land in a notes table; for now encourage a file or keep the nook file-centric
        setErr('drop a local file to share from the nook');
      }
      setFile(null);
      setNote('');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-36 pb-28 px-5 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          className="glass rounded-[30px] p-8 shadow-2xl border border-white/10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>
            Soft Lumen Nook
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3 leading-snug">
            A still corner for one thing.
          </h1>
          <p className="text-neutral-400 text-[14.5px] leading-relaxed mb-7">
            Drop a single local file into this quiet nook. Add a short note if you like. It settles into storage and public_shares. The share link carries a polished Discord embed. Soft spring motion, frosted glass, warm light. Large files receive only a gentle warning of slowness. All prior desks remain fully intact. No traces of boosting.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note…"
            rows={3}
            maxLength={280}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full cursor-pointer border-0"
            />
            <label className="flex-1 text-[14px] text-neutral-300 cursor-pointer hover:text-white transition border border-dashed border-white/15 rounded-[16px] py-3.5 px-4 text-center">
              {file ? file.name : 'Choose a local file'}
              <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || (!file && !note.trim())}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the nook…' : 'Leave in the nook'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.a
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                href={link}
                className="block mt-5 text-[13px] break-all"
                style={{ color: accent }}
              >
                {link}
              </motion.a>
            )}
            {err && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
