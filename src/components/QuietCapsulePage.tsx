import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietCapsulePage() {
  const [note, setNote] = useState('');
  const [unlock, setUnlock] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const publish = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    setWarn(null);
    try {
      const body = `Quiet Capsule\nUnlock after: ${unlock || 'open now'}\n\n${note.trim()}`;
      const file = new File([body], 'quiet-capsule.txt', { type: 'text/plain' });
      if (file.size > 40 * 1024 * 1024) setWarn('Large capsule — may feel slow. No hard limits.');
      const res = await publishLocalFile(file, {
        caption: note.trim().slice(0, 120),
        color: accent,
        cardTitle: 'Quiet Capsule',
        meta: { desk: 'quiet-capsule', unlockAt: unlock || null },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setWarn(res.error || 'publish failed');
    } catch (e: any) {
      setWarn(e.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 24 }}
          className="glass rounded-[36px] p-8 md:p-12 relative"
        >
          <motion.div
            className="absolute -inset-px rounded-[36px] opacity-30 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 0%, ${accent}33, transparent 70%)` }}
            animate={{ opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: accent }}>Quiet Capsule</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">Leave something for later.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            Write a note and optionally set a date. It settles into the database with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Words for later…"
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition resize-none relative"
          />

          <input
            type="datetime-local"
            value={unlock}
            onChange={(e) => setUnlock(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white mb-5 focus:outline-none focus:border-white/30 transition relative"
          />

          <div className="flex items-center gap-3 mb-6 relative">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5 relative">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !note.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl relative"
            style={{ background: accent }}
          >
            {busy ? 'Sealing…' : 'Seal capsule'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center relative">
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{link}</a>
              <p className="text-xs text-neutral-500 mt-1">Discord-ready link</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
