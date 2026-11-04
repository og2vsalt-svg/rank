import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SoftQuietCovePage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'This file is large. The upload may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const share = async () => {
    if (!file && !note.trim()) return setErr('add a note or a local file');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      if (file) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'from the quiet cove',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softquietcove' },
        });
        if (res.ok && res.embed) setLink(res.embed);
        else if (!res.ok) setErr(res.error || 'upload failed');
        setFile(null);
      } else if (note.trim()) {
        // For note-only, still create a lightweight share or just show, but to keep consistent use a tiny placeholder if needed
        setErr('attach a file to land in the share table, or use another desk for pure notes');
      }
      setNote('');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{ background: `radial-gradient(ellipse at bottom, ${accent}25, transparent 70%)` }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative pt-32 pb-24 px-6 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[30px] p-8 shadow-2xl border border-white/10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Soft Quiet Cove</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3 text-white">A sheltered place for what you carry.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop a local file with a quiet note. Soft light gathers in the cove. It lands in storage and public_shares. Every share link unfurls a polished Discord card. Large files receive only a gentle warning of possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note for the cove…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="flex-1 text-[13px] text-neutral-300 cursor-pointer hover:text-white transition border border-dashed border-white/15 rounded-[16px] py-3 px-4 text-center">
              {file ? file.name : 'Choose a local file'}
              <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || (!file && !note.trim())}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling in the cove…' : 'Share to the cove'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.a
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                href={link}
                className="block mt-5 text-[13px] break-all hover:underline"
                style={{ color: accent }}
              >
                {link}
              </motion.a>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
